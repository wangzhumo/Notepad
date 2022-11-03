---
title: Android WebViewCache/Pool 加速
lang: zh-CN
tags:
  - Android
date: 2021-08-10
---

## webview-process（加载速度）

> App中大量Web页面的使用容易导致App内存占用巨大，存在内存泄露，崩溃率高等问题，WebView独立进程的使用是解决Android WebView相关问题的一个合理的方案。
> https://www.jianshu.com/p/b66c225c19e2

<!-- more -->

## Android WebView的问题
1. WebView导致的OOM问题
2. Android版本不同，采用了不同的内核，兼容性Crash
3. WebView代码质量，WebView和Native版本不一致，导致Crash

![wechat](https://image.wangzhumo.com/2021/09/20211005162614.png)

```shell
以上是微信的进程list，简单分析一下各个进程的功能如下：
com.tencent.mm ：微信主进程，会话和朋友圈相关
com.tencent.mm:push ：微信push, 保活
com.tencent.mm:tools 和 com.tencent.mm:support : 功能支持，比如微信中打开一个独立网页是在tools进程中
com.tencent.mm:exdevice ：估计是监控手机相关的
com.tencent.mm:sandbox ：公众号进程，公众号打开的页面都是在该进程中运行
com.tencent.mm:appbrand ：适用于小程序，测试发现微信每启动一个小程序，都会建立一个独立的进程 appbrand[0], 最多开5个进程

微信通过这样的进程分离，将网页、公众号、小程序分别分离到独立进程中，有效的增加了微信的内存使用，避免了WebView对主进程内存的占用导致的主进程服务异常；同时也通过这种独立进程方案避免了质量参差不齐的公众号网页和小程序Crash影响主进程的运行。由此可见，WebView独立进程方案是可行的，也是必要的。

```

## 实现WebView独立进程

WebView独立进程的实现比较简单，只需要在AndroidManifest中找到对应的WebViewActivity，对其配置"android:inyuWeb"属性即可。

```shell
 <activity
        android:name="io.liuliu.music.webview.WebViewProcessActivity"
        android:configChanges="orientation|keyboardHidden|screenSize"
        android:process=":inyuWeb"
        android:launchMode="singleTask"
        android:theme="@style/CocosAppTheme"
        android:exported="false">
    </activity>

    <service android:name="io.liuliu.music.webview.service.RemoteWebViewService"
        android:exported="true"
        tools:ignore="ExportedService">

        <intent-filter>
            <action android:name="com.inyuapp.mobile.web" />
        </intent-filter>
    </service>

    <service android:name="io.liuliu.music.webview.service.LocalWebViewService"
        android:process=":inyuWeb">
    </service>
```

## WebView进程与主进程间的数据通信
Android中使用Linux的进程模型，进程各自资源独立，线程会共享所在进程的资源
WebView在`:inyuWeb`进程中后，不能共享资源，无法获取音遇App主进程的各种数据。

所以我们要为`:inyuWeb`提供通信能力

Android多进程的通讯方式有很多种，主要的方式有以下几种：

1. AIDL
2. Messenger
3. ContentProvider
4. 共享文件
5. 组件间Bundle传递
6. Socket传输

![ipc](https://image.wangzhumo.com/2021/09/1420866-1a374252300a4018.webp)


**AidlResponse.aidl**,**AidlResponse.aidl**均为实体，只负责承载数据

```java
// AidlRequest.aidl
package io.liuliu.music.webview.internal;

// Declare any non-default types here with import statements

parcelable AidlRequest;



// AidlResponse.aidl
package io.liuliu.music.webview.internal;

// Declare any non-default types here with import statements

parcelable AidlResponse;

```

**IAidlRemoteMiddleware.aidl**作为广播的回调，每次主进程会给注册到主进程的各个监听发送广播
```java
// IAidlRemoteMiddleware.aidl
package io.liuliu.music.webview;


import io.liuliu.music.webview.internal.AidlResponse;

//  通过json来做rpc
interface IAidlLocalReceiver {

    // 接收到主进程发送过来的信息 - 广播
    void onReceiver(in AidlResponse req);

}
```

**IAidlRemoteMiddleware.aidl**最核心的AIDL Binder
* exec 远端进程调用，主进程需要处理并返回
* register  远端注册的广播，需要主进程发送
* unRegister 反注册
* broadcast  方便主进程做实现

```java
// IAidlRemoteMiddleware.aidl
package io.liuliu.music.webview;


import io.liuliu.music.webview.internal.AidlRequest;
import io.liuliu.music.webview.internal.AidlResponse;
import io.liuliu.music.webview.IAidlLocalReceiver;

//  通过json来做rpc
interface IAidlRemoteMiddleware {

    // 执行主进程中可以使用的方法.
    AidlResponse exec(in AidlRequest req);

    // 注册到主进程，接收主进程的广播.
    void register(in String key,IAidlLocalReceiver receiver);
    void unRegister(in String key,IAidlLocalReceiver receiver);

    // 发送广播到每一个监听者.
    void broadcast(in AidlResponse resp);

}
```

---

Java层
```java
package io.liuliu.music.webview.core


/**
 * If you have any questions, you can contact by email {wangzhumoo@gmail.com}
 *
 * @author 王诛魔 2021/8/10  2:47 下午
 *
 * service 的管理，此处负责
 * 1.创建并且绑定RemoteService
 * 2.负责生命周期，需要关闭
 */
class RemoteServiceManager : OnActionListener<Response>, ListenerReceiver {

    private var asInterface: IAidlRemoteMiddleware? = null
    private var hashAsInterface = hashMapOf<Context,IAidlRemoteMiddleware>()
    private var mContext: Context? = null
    private var localReceiver: LocalAidlInterfaceImpl? = null
    private var listeners: MutableList<OnActionListener<Response>> = mutableListOf()
    private var currentCalledId = 0

    /**
     * 建立aidl的链接，开始先client提供相应的服务
     *
     * 因为与主进程保持共同的周期，inyuweb一定是可以调用到的
     */
    fun initAidlConnect(ctx: Context, currentId: Int) {
        this.currentCalledId = currentId
        this.mContext = ctx
        this.localReceiver = LocalAidlInterfaceImpl()
        this.localReceiver?.registerListener(this)
        // 建立连接，获取binder
        connectBinderPoolService()
        KLog.e(TAG, "initAidlConnect connectBinderPoolService")
    }

    fun stopAidlService(ctx: Context, currentId: Int) {
        if (currentCalledId != currentId) return
        this.asInterface?.unRegister(IWebProcessCmd.BroadcastCmd.BROADCAST_LOTTERY, localReceiver)
        this.asInterface?.asBinder()?.unlinkToDeath(mBinderPoolDeathRecipient, 0)
        this.localReceiver?.unregisterListener(this)
        ctx.unbindService(mBinderConnection)
        this.asInterface = null
        KLog.e(TAG, "stopAidlService unbindService")
    }

    /**
     * 给外部提供一个调用对象
     */
    fun getRemoteMiddleware(): IAidlRemoteMiddleware? {
        return asInterface
    }

    /**
     * 直接执行一个方法
     *
     * caller - inyuweb
     */
    fun execute(jsonRpc: JsonRpc): Response {
        val req = AidlRequest(jsonRpc.toJson())
        return execute(req)
    }

    /**
     * 直接执行一个方法
     *
     * caller - inyuweb
     */
    private fun execute(request: AidlRequest): Response {
        val exec = asInterface?.exec(request)
        exec?.run {
            val payload = getPayload()
            if (payload?.isNotEmpty() == true) {
                return Response.fromJson(payload)
            }
        }
        return Response(error = Error(500, "call error."))
    }

    @Synchronized
    private fun connectBinderPoolService() {
        mContext?.let {
            val service = Intent(it, RemoteWebViewService::class.java)
            it.bindService(service, mBinderConnection, Context.BIND_AUTO_CREATE)
        }
    }

    // service 的connection
    private val mBinderConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            asInterface = IAidlRemoteMiddleware.Stub.asInterface(service)
            asInterface?.asBinder()?.linkToDeath(mBinderPoolDeathRecipient, 0)
            KLog.e(TAG, "onServiceConnected asInterface?.register")
            // 注册到服务端
            asInterface?.register(IWebProcessCmd.BroadcastCmd.BROADCAST_LOTTERY, localReceiver)
            KLog.e(TAG, "onServiceConnected asInterface  register BROADCAST_LOTTERY")
            // 需要通知每一个ActionListener - 已经可用了
            onAction(LocalAidlInterfaceImpl.AVAILABLE_CODE, null)
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            KLog.e(TAG, "onServiceDisconnected")
        }
    }


    override fun onAction(action: Int, obj: Response?) {
        listeners.forEach {
            it.onAction(action, obj)
        }
    }

    override fun registerListener(listener: OnActionListener<Response>) {
        listeners.add(listener)
    }

    override fun unregisterListener(listener: OnActionListener<Response>?) {
        listeners.remove(listener)
    }

    /**
     * 发送消息给web进程
     */
    fun broadcast(response: AidlResponse, ctx: Context) {
        // 如果这里自己的进程，直接发即可.
        if (ProcessUtil.isWebProcess(ctx)) {
            val payload = response.getPayload()
            if (!payload.isNullOrEmpty()) {
                onAction(512, Response.fromJson(payload))
            }

            // 否则交给主进程去转发
        } else {
            asInterface?.broadcast(response)
        }
    }

    private val mBinderPoolDeathRecipient: DeathRecipient = object : DeathRecipient {
        override fun binderDied() {
            KLog.e(TAG, "mBinderPoolDeathRecipient binderDied")
            asInterface?.unRegister(IWebProcessCmd.BroadcastCmd.BROADCAST_LOTTERY, localReceiver)
            asInterface?.asBinder()?.unlinkToDeath(this, 0)
            // null 说明是手动关闭的，不需要再连接了.
            if (asInterface != null) {
                asInterface = null
                connectBinderPoolService()
            }
        }
    }

    companion object {
        val instance: RemoteServiceManager by lazy(mode = LazyThreadSafetyMode.SYNCHRONIZED) {
            RemoteServiceManager()
        }

        const val TAG = "WebViewProcessTag"
    }
}
```
通过initAidlConnect连接主进程，并保持对象，方便后面调用。


## WebView的缓存池

通过WebViewCachePoolb保持webview实例，或者进程提前初始化，尽量减少webview打开需要的时间

```kotlin
package io.liuliu.music.webview.utils


/**
 * If you have any questions, you can contact by email {wangzhumoo@gmail.com}
 *
 * @author 王诛魔 2021/8/9  4:25 下午
 *
 * 缓存webView的实例 - 加快加载速度
 */
class WebViewCachePool private constructor() {

    /**
     * 正在被使用的WebVie List集合
     */
    private var usedWebViewList: MutableList<AppWebView> = mutableListOf()

    /**
     * 预准备的WebView List集合(当回收集合里没有WebView才会被使用)
     */
    private var readyWebViewList: MutableList<AppWebView> = mutableListOf()

    /**
     * 被回收的WebView List 集合(可被复用)
     */
    private var recyclerWebViewList: MutableList<AppWebView> = mutableListOf()

    /**
     * 最大的WebView个数(以上集合内的WebView个数不会超过这个数，为内存作考虑)
     * 注意：为负数时,会无限采用复用,不存在销毁，谨慎使用
     */
    private var maxWebViewCount = 10

    private var contextWeakReference: WeakReference<Context>? = null

    private var creator: CreatorWebView? = null


    ///////////////////////////初始化//////////////////////////////
    /**
     * 负责装载Context,这里的context比较重要
     *
     * @param ctx Context
     * 1.必须是当前进程所提供的 - 虽然不知道是不是用主进程有啥问题，但是尽量避免
     * 2.必须调用,这里是第一步
     */
    fun init(ctx: Context): WebViewCachePool {
        contextWeakReference = WeakReference<Context>(ctx)
        return this
    }

    /**
     * 设置最大缓存数
     */
    fun creator(creator: CreatorWebView): WebViewCachePool {
        this.creator = creator
        return this
    }

    /**
     * 创建
     */
    fun build(): WebViewCachePool {
        if (contextWeakReference == null) {
            throw NullPointerException("context null.")
        }
        // 最后设置默认的参数
        if (creator == null) {
            creator = object : CreatorWebView {
                override fun newWebView(ctx: Context): AppWebView {
                    return AppWebView(ctx)
                }
            }
        }
        // 设置最大缓存数
        maxWebViewCount = creator?.maxSize() ?: CreatorWebView.defaultMaxSize
        // 预加载一个
        return this
    }


    ///////////////////////////webView操作//////////////////////////////
    fun getWebView(): AppWebView? {
        val canUseWebView = getCanUseWebView()
        return canUseWebView?.let {
            usedWebViewList.add(it)
            canUseWebView.loadUrl("")
            return@let it
        }
    }

    /**
     * 预加载一个
     *
     * 添加到可用队列，不做返回不允许使用
     */
    fun preLoad() {
        createWebView()?.let {
            initWebSetting(it)
            readyWebViewList.add(it)
            initWebSetting(it)
        }
    }

    /**
     * 外部调用 - 销毁
     */
    fun destroy(webView: AppWebView, jsName: String? = "android") {
        usedWebViewList.remove(webView)

        if (getAllWebViewSize() >= maxWebViewCount && maxWebViewCount >= 0) {
            //不能进行复用了，达到最大数目
            //将WebView进行完全回收
            destroyWebView(webView)
        } else {
            //只是将WebView进行初始化状态
            initWebViewAndUse(webView, jsName)
            recyclerWebViewList.add(webView)
        }
    }

    /**
     * 外部调用，清掉所有的WebView实例
     */
    fun release(){
        readyWebViewList.forEach {
            destroyWebView(webView = it)
        }
        readyWebViewList.clear()
        recyclerWebViewList.forEach {
            destroyWebView(webView = it)
        }
        recyclerWebViewList.clear()
    }

    /**
     * 完全销毁WebView
     *
     * @param webView
     */
    private fun destroyWebView(webView: WebView) {
        webView.stopLoading()
        webView.loadDataWithBaseURL(null, "", "text/html", "utf-8", null)
        webView.removeJavascriptInterface("android")
        val parent = webView.parent
        if (parent is ViewGroup) {
            parent.removeView(webView)
        }
        webView.settings.javaScriptEnabled = false
        webView.clearHistory()
        webView.removeAllViews()
        webView.clearCache(true)
        webView.destroy()
    }

    /**
     * 只是将WebView设置为可重用状态
     *
     * @param webView
     * @param jsName
     */
    private fun initWebViewAndUse(webView: WebView, jsName: String? = "android") {
        webView.webChromeClient = null
        webView.webViewClient = null
        webView.loadDataWithBaseURL(null, "", "text/html", "utf-8", null)
        webView.removeJavascriptInterface(jsName)
        val parent = webView.parent
        if (parent is ViewGroup) {
            parent.removeView(webView)
        }
        //清理缓存(要是不清理，占用的内存只会越来越大，最终导致OOM)
        webView.clearHistory()
        webView.clearCache(true)
    }

    // 创建一个新的WebView
    private fun createWebView(): AppWebView? {
        return contextWeakReference?.let { ctx ->
            ctx.get()?.let { creator?.newWebView(it) }
        }
    }

    private fun getAllWebViewSize(): Int {
        var size = 0
        size += usedWebViewList.size
        size += readyWebViewList.size
        size += recyclerWebViewList.size
        return size
    }

    /**
     * 获取到能够被使用的WebView
     * @return
     */
    private fun getCanUseWebView(): AppWebView? {
        var canUseWebView: AppWebView?
        // 先使用复用集合的
        if (recyclerWebViewList.isEmpty()) {
            // 查找已经准备好的新webView
            if (readyWebViewList.isEmpty()) {
                // 没有可用的新建webView
                canUseWebView = createWebView()?.let {
                    return initWebSetting(it)
                }
            } else {
                // 有可用的新建webView
                canUseWebView = readyWebViewList.removeFirst()
                return initWebSetting(canUseWebView)
            }
        } else {
            // 获取
            canUseWebView = recyclerWebViewList.removeFirst()
        }
        return canUseWebView
    }

    private fun initWebSetting(webView: AppWebView): AppWebView {
        //这句不加会导致WebView显示不正常
        val params: ViewGroup.LayoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        webView.layoutParams = params
        webView.resumeTimers()
        webView.onResume()
        val webSettings: WebSettings = webView.settings
        //页面白屏问题
        webView.setBackgroundColor(Color.parseColor("#0D000000"))

        // init webView settings
        webSettings.allowContentAccess = true
        webSettings.databaseEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.setAppCacheEnabled(true)
        webSettings.savePassword = false
        webSettings.saveFormData = false
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true
        webSettings.javaScriptEnabled = true
        webSettings.allowFileAccess = true
        webSettings.setSupportZoom(false)
        webSettings.builtInZoomControls = true
        webSettings.displayZoomControls = false
        webSettings.textZoom = 100

        // 设置在页面装载完成之后再去加载图片
        webSettings.loadsImagesAutomatically = false
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        return webView
    }

    companion object {
        // 单例获取
        @JvmStatic
        val instance = SingletonHolder.holder
    }

    private object SingletonHolder {
        val holder = WebViewCachePool()
    }
}
```


## WebView的本地缓存文件

Cocos加载的过程中，需要很多的资源文件，每次都下载太浪费时间了
我们使用缓存文件来保存这些文件，下次再加载就可以直接使用了

### 配置缓存
```java
/**
 * 初始化webView的数据缓存
 */
private fun initWebCache(){
    // 离线缓存webView数据
    val builder = WebViewCacheInterceptor.Builder(application)
    val extension = CacheExtensionConfig()
    extension.addExtension("json")
    extension.addExtension("m4a")
    builder.setCacheExtensionConfig(extension)
    builder.setDebug(true)
    builder.setCachePath(File(WebStorageUtils.getAbleCacheDir(application), "webCache"))
    WebViewCacheInterceptorInst.getInstance().init(builder)
}
```


### 加载缓存
```java
 // 设置webViewClient
webView?.webViewClient = object : WebViewClient() {

    override fun shouldInterceptRequest(
        webview: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        val adapter = WebResourceRequestAdapter.adapter(request)
        val interceptRequest = WebViewCacheInterceptorInst.getInstance().interceptRequest(adapter)
        return WebResourceResponseAdapter.adapter(interceptRequest)
    }

    override fun onPageFinished(p0: WebView?, p1: String?) {
        super.onPageFinished(p0, p1)
        viewModel?.progress?.value = 1F
    }

    override fun onPageStarted(p0: WebView?, p1: String?, p2: Bitmap?) {
        super.onPageStarted(p0, p1, p2)
        viewModel?.progress?.value = 0F
        webView?.settings?.loadsImagesAutomatically = true
    }
}
```


以上方案在线上表现良好
NOTE:
某些机型在使用WebView Pool 的时候，最好是使用MultiContext来初始化