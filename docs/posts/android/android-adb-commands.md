---
title: Android开发中常用的Adb命令
lang: zh-CN
tags:
  - Android
date: 2020-12-02
---

## 配置环境

在做这些之前,先配置好adb环境变量,以我的配置为例

```shell
$ vim ~/.bash_profile

export ANDROID_HOME=/Users/phyooos/Library/Android/sdk
...
export PATH={省略}:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

$ source ~/.bas

$ adb
Android Debug Bridge version 1.0.39
Version 0.0.1-4500957
Installed as /Users/phyooos/Library/Android/sdk/platform-tools/adb
...
```

补充

> adb shell pm list packages   当前手机安装的所有app包名
> adb shell pm list packages | grep 'google'  在所有包名中查找带'google'的

<!-- more -->

## 连接设备

打开开发者 -> 打开调试 -> 允许调试

#### 1.通过usb连接

#### 2.通过wifi连接

  保证Android设备与电脑在局域网中,网段要一致 eg:  `192.168.2.98 , 192.168.2.111`

```shell
~ ⌚ 9:44:55
$ adb connect 192.168.6.51
unable to connect to 192.168.6.51:5555: Connection refused
```

  此时是连接不上的,要先tcpip 5555,如下:

```shell
#使用Tcp并监听端口5555
adb tcpip 5555

#连接设备
adb connect 192.168.6.51
```

  如果你想用usb调试

```shell
#使用usb调试  
adb usb 
```

## 设备

#### 查看设备

```shell
$ adb devices
List of devices attached
3080b82d    device
860BCML228J8    device
```

#### 指定设备

> adb 命令必须指定一个设备使用

```shell
abd -s 编号 命令
比如我要连接3080b82d    device 这个设备,安装一个apk

eg:
$ adb -s 3080b82d install Test.apk
Success
```

## 安装/卸载Apk

#### 安装

```shell
$ adb -s 3080b82d install Users/phyooos/develop/Test.apk
Success
```

install 跟上apk的path即可

install 可以搭配几个参数使用,比较常用的是

`install -r `   替换掉原来的apk.(被称为强制安装)    至于其他的参数去google官网看吧

`install -t`  可以安装测试包

#### 卸载

```shell
adb uninstall [软件包名]

adb uninstall -k [软件包名]
```

- -k 参数,卸载软件但是保留配置和缓存文件.

包名使用文章开始的命令查找即可(当前有两个手机,还要指定设备)

```shell
$ adb -s 3080b82d shell pm list packages | grep 'miui'
package:com.miui.screenrecorder
package:com.miui.contentextension
package:com.miui.powerkeeper
```

## 

## 拉取/推送文件

#### 发送

`adb push [本地路径] [远程路径]`

#### 下载文件

`adb pull [远程路径] [本地路径]`

## 

## 截图录屏

#### 截图

#### `adb shell screencap [path]`

```
adb shell screencap /sdcard/screen.png
#截图并保存到/sdcard/screen.png
```

#### 录屏

#### `adb shell screenrecord [path]`

```
adb shell screenrecord /sdcard/demo.mp4
#录屏
```

注意:   按Ctrl-C 结束录制

```
adb shell screenrecord --size <WIDTHxHEIGHT>

adb shell screenrecord --bit-rate <RATE>
adb shell screenrecord --bit-rate 5000000 /sdcard/demo.mp4

adb shell screenrecord --time-limit <TIME>

adb shell screenrecord --rotate

adb shell screenrecord --verbose
```

## 

## Package

#### 查看所有包

 `adb shell pm list packages`

```shell
$ adb shell pm list packages
package:com.flyme.roamingpay
package:com.android.cts.priv.ctsshim
package:com.meizu.pps
package:com.meizu.net.pedometer
package:com.android.providers.telephony
```

#### 系统应用

`adb shell pm list packages -s `

```shell
$ adb shell pm list packages -s
package:com.miui.screenrecorder
package:com.android.cts.priv.ctsshim
package:com.qualcomm.qti.auth.sampleextauthservice
package:com.qualcomm.qti.perfdump
...
```

#### 普通外来应用

`adb shell pm list packages -3 `

```shell
$ adb shell pm list packages -3
package:com.google.android.youtube
package:com.hpbr.bosszhipin
package:de.blinkt.openvpn
package:org.iggymedia.periodtracker
package:com.daimajia.gold
```

#### 其他参数

```shell
#See their associated file.
adb shell pm list packages -f 

#Filter to only show disabled packages.
adb shell pm list packages -d 

#Filter to only show enabled packages.
adb shell pm list packages -e 

#See the installer for the packages.
adb shell pm list packages -i 

#Also include uninstalled packages.
adb shell pm list packages -u 
```

#### 通过包名查找app位置

#### `adb shell pm path [packagename]  `

```
$ adb shell pm path com.miui.screenrecorder
package:/system/app/MiuiScreenRecorder/MiuiScreenRecorder.apk
```

#### 清除缓存

#### `adb shell pm clear  [packageName] `

清除了该app的  data  cache

```
$ adb shell pm clear com.yhcs.carmart
Success
```

## shell

我们知道android其实精简了linux的命令,有一大部分linux命令没法用的

```shell
$ adb shell
#即可进入

如果要root权限,国内手机好像不一致,我是用过的为
$ adb root
$ adb shell

此时权限就是root

进入shell后,就可以为所欲为,一般和linux一致
```

不过这些,还是管用的

```
ls , cd , rm , mkdir , touch , pwd ,cp , mv ,netstat , ping, ip 
```

举一个例子,我想查看当前wifi的ip是多少.

```shell
$ adb shell
sagit:/ $ ip -f inet addr show wlan0
23: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 3000
    inet 192.168.6.51/23 brd 192.168.7.255 scope global wlan0
       valid_lft forever preferred_lft forever
sagit:/ $

#ip  inet 192.168.6.51  这个就是
```

## Logcat

`adb logcat [option] [filter]`

- 查看log `adb logcat`
  
  通过  control + c  退出

- 查看Debug的log `adb logcat *:D`

Logcat,还是Android studio 看起来方便,所以没有继续去看,也就不说了

## 

## Dumpsys

这是一个很强大的命令

#### 电量

`adb shell dumpsys battery`

#### 服务列表

`adb shell dumpsys`

下面的命令  `| more` 是为了显示所有的数据 

```
$ adb shell dumpsys | more
Currently running services:
  DockObserver
  MiuiBackup
  MiuiInit
  SurfaceFlinger
  accessibility
  account
  activity
  alarm
  ...
```

这个Currently running services   所有的项目,都可以详细查询

#### 查询单个service

`adb shell dumpsys [service name]`

搞几个例子看看:

- 屏幕分辨率`adb shell dumpsys window displays`

```
$ adb shell dumpsys window displays

WINDOW MANAGER DISPLAY CONTENTS (dumpsys window displays)
  Display: mDisplayId=0
    init=1080x1920 480dpi cur=1080x1920 app=1080x1920 rng=1080x1020-1920x1860
    deferred=false mLayoutNeeded=false
```

其中:

init=1080x1920  分辨率

480dpi   dpi值

#### activity信息

`adb shell dumpsys activity`

比如我想看看我activity的信息`adb shell dumpsys activity | grep 'com.yhcs.carmart'`

```
$ adb shell dumpsys activity | grep "com.yhcs.carmart"
  * com.yhcs.carmart: 2 items
    #0: PendingIntentRecord{c526be3 com.yhcs.carmart startService}
    #1: PendingIntentRecord{8949e0 com.yhcs.carmart broadcastIntent}
      -> 8161:com.yhcs.carmart/u0a460 s1/1 u0/0 +44s372ms
      -> 8556:com.yhcs.carmart:channel/u0a460 s1/1 u0/0 +33s684ms

      ...

  * Recent #0: TaskRecord{6019b81 #14799 A=com.yhcs.carmart U=0 StackId=1 sz=1}
   packageName=com.yhcs.carmart processName=com.yhcs.carmart
   launchedFromUid=10460 launchedFromPackage=com.yhcs.carmart userId=0
   app=ProcessRecord{3c52934 8161:com.yhcs.carmart/u0a460}
   Intent { cmp=com.yhcs.carmart/.ui.main.MainActivity }
   frontOfTask=true task=TaskRecord{6019b81 #14799 A=com.yhcs.carmart U=0 StackId=1 sz=1}
   taskAffinity=com.yhcs.carmart
   realActivity=com.yhcs.carmart/.ui.main.MainActivity
```

现在指定查看这个activity

```
$ adb shell dumpsys activity com.yhcs.carmart/.ui.main.MainActivity
TASK com.yhcs.carmart id=14799 userId=0
  ACTIVITY com.yhcs.carmart/.ui.main.MainActivity a99200b pid=8161
    Local Activity 90efa41 State:
      mResumed=false mStopped=true mFinished=false
      mChangingConfigurations=false
      mCurrentConfig={1.0 460mcc11mnc [zh_CN] ldltr sw360dp w360dp h620dp 480dpi nrml long port finger -keyb/v/h -nav/h appBounds=Rect(0, 0 - 1080, 1920) s.12 themeChanged=0 themeChangedFlags=0}
      ...
View Hierarchy:
      DecorView@ce71c9e[MainActivity]
        android.widget.LinearLayout{6106377 V.E...... ......ID 0,0-1080,1920}
      ...
Active Fragments 
      ...
```

里面有很多信息
