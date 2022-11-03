---
title: Android Studio中使用CMake进行JNI开发
lang: zh-CN
tags:
  - Android
  - Cmake
date: 2021-09-02
---

## 前言

定一个小目标,替代RenderScript来做一个图片的高斯模糊,因为这是一个比较考验性能的操作,所以我打算用C来做这个操作(主要原因是我自己不会写C++,刚好看到有这个开源算法...)

<!-- more -->

## 创建项目

> new -> new Module -> Android Library

当项目创建好之后,这只是一个单纯的Library,并不能使用JNI开发

下面,我们把它改造一下(下图是改造完成的目录结构):

![file](https://image.wangzhumo.com/2021/09/jni_folder.png)

### 添加CMakeLists.txt

> 选中lib_blur - new File - CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.4.1)
#设置生成的so动态库最后输出的路径
#set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI})
add_library( # 库名
             sample
             # 该库生成动态函数
             SHARED
             # 依赖的文件
             src/main/cpp/samplelib.cpp)

find_library( # 设置Path变量的名称
              log-lib

              # 指定要查询的库名字
              # 在ndk中查找 liblog.so 函数库
              log )

target_link_libraries( # 目标库
                       sample
                       # 要链接的库
                       android
                       # Links the target library to the log library
                       # included in the NDK.
                       ${log-lib} )
```

### 修改build.grade

```groovy
android {
    defaultConfig {
        //...

        ndk {
            // 设置支持的SO库架构
            abiFilters 'armeabi-v7a', 'x86'
        }

        externalNativeBuild {
            cmake {
                cppFlags "-std=c++14", "-frtti", "-fexceptions"
            }
        }    
    }

    //...
    externalNativeBuild {
        cmake {
            path "CMakeLists.txt"
        }
    }
} 
```

### 编写C++文件

我们的C文件都在`src/main/cpp`文件夹下,每一个C文件都需要在`CMakeLists.txt`文件中指定

```groovy
 # 依赖的文件
 src/main/cpp/samplelib.cpp
```

samplelib.cpp

```cpp
#include <jni.h>
#include <stdlib.h>
#include <string>
#include <android/log.h>
#define TAG    "JNI_LOG"
#define LOGE(...)  __android_log_print(ANDROID_LOG_ERROR,TAG ,__VA_ARGS__)

using namespace std;


#ifdef __cplusplus
extern "C" {
#endif

//定义我Java文件的位置,注意是'/'分开
static const char *className = "com/wangzhumo/app/commonlib/jni/JniManager";

//返回一个string
jstring stringFromJNI(JNIEnv *env,jclass clz) {
    std::string hello = "Hello from C++";
    return env->NewStringUTF(hello.c_str());
}

//返回一个string 并把这句话打印到logcat中去
jstring sayHello(JNIEnv* env,jclass clz) {
    std::string hello = "Say Hello from C++";
    LOGE("Say Hello and value");
    return env->NewStringUTF(hello.c_str());
}

//获取所有方法名
static JNINativeMethod gJniMethods[] = {
        {"sayHello", "()Ljava/lang/String;", (void*)sayHello},
        {"stringFromJNI", "()Ljava/lang/String;", (void*)stringFromJNI},
};
//其中{"MethodName","(入参)返回值",()Method}

//动态注册本地方法
static int jniRegisterNativeMethods(JNIEnv* env, const char* className,
                                    const JNINativeMethod* gMethods, int numMethods) {
    jclass clazz;
    clazz = (env)->FindClass( className);
    if (clazz == NULL) {
        return -1;
    }

    int result = 0;
    if ((env)->RegisterNatives(clazz, gMethods, numMethods) < 0) {
        result = -1;
    }

    (env)->DeleteLocalRef(clazz);
    return result;
}

//JNI_OnLoad回调
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved){

    JNIEnv* env = NULL;
    jint result = -1;

    if (vm->GetEnv((void**) &env, JNI_VERSION_1_6) != JNI_OK) {
        return result;
    }

    jniRegisterNativeMethods(env, className, gJniMethods, sizeof(gJniMethods) / sizeof(JNINativeMethod));

    return JNI_VERSION_1_6;
}

#ifdef __cplusplus
}
#endif
```

### 编写Java文件

```java
public class JniManager {

    static{
        System.loadLibrary("sample");
    }

    public static native String sayHello();
    public static native String stringFromJNI();
}
```

## 编译

> Build -> Make Project

编译完成,如果成功则 build -> intermediates -> cmake  下就有 .so文件

如图所示:

![jni_so_file](https://image.wangzhumo.com/2021/09/jni_so_file.png)

我们可以看到,生成了 armeabi-v7a,  x86两种类型的.so文件,在build.gradle中声明:

```groovy
ndk {
    // 设置支持的SO库架构
    abiFilters 'armeabi-v7a', 'x86'
}
```

## 调用

```java
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }

    override fun onResume() {
        super.onResume()
        Log.e("JNI",JniManager.sayHello())
        Log.e("JNI",JniManager.stringFromJNI())
    }
}
```

结果:

```shell
07-26 17:42:41.420 6685-6685/com.wangzhumo.playground E/JNI_LOG: Say Hello and value
07-26 17:42:41.420 6685-6685/com.wangzhumo.playground E/JNI: Say Hello from C++
07-26 17:42:41.420 6685-6685/com.wangzhumo.playground E/JNI: Hello from C++
```

其中`JNI_LOG`是由 cpp 中的方法打印到Android的控制台的

`JNI`是我们在MainActivity中调用的

## 结语

以上说明我的JNI算是初步完成了调用

> http://zhixinliu.com/2015/07/01/2015-07-01-jni-register/

> https://developer.android.com/ndk/guides/
