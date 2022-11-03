---
title: Android 增加64位支持
lang: zh-CN
tags:
  - Android
date: 2021-08-10
---

## 一.查找

这里使用gradle task 的形式找到所有的so库

通过 apply from:`findso.gradle`加入到项目中

<!-- more -->

### findso.gradle

```groovy
tasks.whenTaskAdded { task ->
    //如果是有多个flavor，则用 mergeFlavorDebugNativeLibs的形式
    if (task.name=='mergeDebugNativeLibs') { 
        task.doFirst {
            println("------------------- find so files start -------------------")
            println("------------------- find so files start -------------------")
            println("------------------- find so files start -------------------")

            it.inputs.files.each { file ->
                printDir(new File(file.absolutePath))
            }

            println("------------------- find so files end -------------------")
            println("------------------- find so files end -------------------")
            println("------------------- find so files end -------------------")
        }
    }
}

def printDir(File file) {
    if (file != null) {
        if (file.isDirectory()) {
            file.listFiles().each {
                printDir(it)
            }
        } else if (file.absolutePath.endsWith(".so")) {
            def name = file.absolutePath
            def index = name.indexOf("/jni/")
            name = name.substring(index)
            println "find so file: $name"
        }
    }
}
```

运行项目得到输出：

```shell
------------------- find so files start -------------------
------------------- find so files start -------------------
------------------- find so files start -------------------
find so file: /jni/armeabi-v7a/libnama.so
find so file: /jni/armeabi-v7a/libQPlayer.so
find so file: /jni/armeabi-v7a/libqcOpenSSL.so
find so file: /jni/armeabi-v7a/libsecsdk.so
find so file: /jni/x86/libsecsdk.so
find so file: /jni/arm64-v8a/libsecsdk.so
find so file: /jni/armeabi/libsecsdk.so
find so file: /jni/x86_64/libsecsdk.so
find so file: /jni/armeabi-v7a/libmmkv.so
find so file: /jni/x86/libmmkv.so
find so file: /jni/arm64-v8a/libmmkv.so
find so file: /jni/armeabi/libmmkv.so
find so file: /jni/x86_64/libmmkv.so
find so file: /jni/armeabi-v7a/libapminsighta.so
find so file: /jni/armeabi-v7a/libapminsightb.so
find so file: /jni/x86/libapminsighta.so
find so file: /jni/x86/libapminsightb.so
find so file: /jni/arm64-v8a/libapminsighta.so
find so file: /jni/arm64-v8a/libapminsightb.so
find so file: /jni/x86_64/libapminsighta.so
find so file: /jni/x86_64/libapminsightb.so
find so file: /jni/armeabi-v7a/libevent_extra-2.1.so
find so file: /jni/armeabi-v7a/libflipper.so
find so file: /jni/armeabi-v7a/libevent_core-2.1.so
find so file: /jni/armeabi-v7a/libevent-2.1.so
find so file: /jni/x86/libevent_extra-2.1.so
find so file: /jni/x86/libflipper.so
find so file: /jni/x86/libevent_core-2.1.so
find so file: /jni/x86/libevent-2.1.so
find so file: /jni/arm64-v8a/libevent_extra-2.1.so
find so file: /jni/arm64-v8a/libflipper.so
find so file: /jni/arm64-v8a/libevent_core-2.1.so
find so file: /jni/arm64-v8a/libevent-2.1.so
find so file: /jni/x86_64/libevent_extra-2.1.so
find so file: /jni/x86_64/libflipper.so
find so file: /jni/x86_64/libevent_core-2.1.so
find so file: /jni/x86_64/libevent-2.1.so
find so file: /jni/armeabi-v7a/libc++_shared.so
find so file: /jni/x86/libc++_shared.so
find so file: /jni/arm64-v8a/libc++_shared.so
find so file: /jni/x86_64/libc++_shared.so
find so file: /jni/armeabi-v7a/libmarsxlog.so
find so file: /jni/armeabi-v7a/libc++_shared.so
find so file: /jni/armeabi-v7a/libauth_number_product-2.12.1.4-log-online-standard-release_alijtca_plus.so
find so file: /jni/armeabi-v7a/libalicomphonenumberauthsdk_core.so
find so file: /jni/x86/libauth_number_product-2.12.1.4-log-online-standard-release_alijtca_plus.so
find so file: /jni/x86/libalicomphonenumberauthsdk_core.so
find so file: /jni/arm64-v8a/libauth_number_product-2.12.1.4-log-online-standard-release_alijtca_plus.so
find so file: /jni/arm64-v8a/libalicomphonenumberauthsdk_core.so
find so file: /jni/armeabi/libauth_number_product-2.12.1.4-log-online-standard-release_alijtca_plus.so
find so file: /jni/armeabi/libalicomphonenumberauthsdk_core.so
find so file: /jni/armeabi-v7a/libEncryptorP.so
find so file: /jni/x86/libEncryptorP.so
find so file: /jni/arm64-v8a/libEncryptorP.so
find so file: /jni/armeabi/libEncryptorP.so
find so file: /jni/x86_64/libEncryptorP.so
find so file: /jni/mips/librealm-jni.so
find so file: /jni/armeabi-v7a/librealm-jni.so
find so file: /jni/x86/librealm-jni.so
find so file: /jni/arm64-v8a/librealm-jni.so
find so file: /jni/x86_64/librealm-jni.so
find so file: /jni/armeabi-v7a/libAgoraMediaPlayer.so
find so file: /jni/armeabi-v7a/libapm-packet-processing-jni.so
find so file: /jni/armeabi-v7a/libagora-crypto.so
find so file: /jni/armeabi-v7a/libagora-rtc-sdk-jni.so
find so file: /jni/armeabi-v7a/libapm-plugin-agora-rtc-player.so
find so file: /jni/armeabi-v7a/libALBiometricsJni.so
find so file: /jni/arm64-v8a/libALBiometricsJni.so
find so file: /jni/armeabi-v7a/libsgmiddletier.so
find so file: /jni/arm64-v8a/libsgmiddletier.so
find so file: /jni/armeabi-v7a/libsgmainso-5.5.28.so
find so file: /jni/armeabi-v7a/libsgmain.so
find so file: /jni/arm64-v8a/libsgmainso-5.5.28.so
find so file: /jni/arm64-v8a/libsgmain.so
find so file: /jni/armeabi-v7a/libsgsecuritybodyso-5.5.28.so
find so file: /jni/armeabi-v7a/libsgsecuritybody.so
find so file: /jni/arm64-v8a/libsgsecuritybodyso-5.5.28.so
find so file: /jni/arm64-v8a/libsgsecuritybody.so
find so file: /jni/armeabi-v7a/libvolc_log.so
find so file: /jni/x86/libvolc_log.so
find so file: /jni/arm64-v8a/libvolc_log.so
find so file: /jni/x86_64/libvolc_log.so
find so file: /jni/armeabi-v7a/libfbjni.so
find so file: /jni/armeabi-v7a/libc++_shared.so
find so file: /jni/x86/libfbjni.so
find so file: /jni/x86/libc++_shared.so
find so file: /jni/arm64-v8a/libfbjni.so
find so file: /jni/arm64-v8a/libc++_shared.so
find so file: /jni/x86_64/libfbjni.so
find so file: /jni/x86_64/libc++_shared.so
find so file: /jni/mips/libopustool.so
find so file: /jni/armeabi-v7a/libopustool.so
find so file: /jni/mips64/libopustool.so
find so file: /jni/x86/libopustool.so
find so file: /jni/arm64-v8a/libopustool.so
find so file: /jni/armeabi/libopustool.so
find so file: /jni/x86_64/libopustool.so
find so file: /jni/armeabi-v7a/libglide-webp.so
find so file: /jni/x86/libglide-webp.so
find so file: /jni/arm64-v8a/libglide-webp.so
find so file: /jni/x86_64/libglide-webp.so
find so file: /jni/armeabi/libutility.so
find so file: /jni/armeabi/libweibosdkcore.so
find so file: /jni/armeabi-v7a/libumeng-spy.so
find so file: /jni/x86/libumeng-spy.so
find so file: /jni/arm64-v8a/libumeng-spy.so
find so file: /jni/armeabi/libumeng-spy.so
find so file: /jni/armeabi-v7a/libtnet-3.1.14.so
find so file: /jni/armeabi-v7a/libcocklogic-1.1.3.so
find so file: /jni/armeabi-v7a/libALBiometricsJni.so
------------------- find so files end -------------------
------------------- find so files end -------------------
------------------- find so files end -------------------
```

以上是App包中所有的so库

## 二.过滤

之后肯定需要多次增加so,并且查看效果，这里直接写一个帮助的类

额，由于IDE过期了，vscode上刚好有Dart环境，这里使用Dart写

```dart
import 'dart:collection';
import 'dart:convert';
import 'dart:io';

void main() async {
  Stream lines = new File("/Users/wangzhumo/Workspace/Vsworkspace/dart/so.txt")
      .openRead()
      .transform(utf8.decoder)
      .transform(const LineSplitter());
  List<String> v7a = List.empty(growable: true);
  List<String> arm = List.empty(growable: true);
  List<String> arm64 = List.empty(growable: true);
  List<String> x86_64 = List.empty(growable: true);
  List<String> x86 = List.empty(growable: true);
  List<String> all = List.empty(growable: true);
  await for (var item in lines) {
    if ((item as String).contains("/armeabi-v7a/")) {
      var name = item.replaceFirst("find so file: /jni/armeabi-v7a/", "");
      v7a.add(name);
      all.add(name);
    } else if ((item as String).contains("/armeabi/")) {
      var name = item.replaceFirst("find so file: /jni/armeabi/", "");
      arm.add(name);
      all.add(name);
    } else if ((item as String).contains("/x86/")) {
      var name = item.replaceFirst("find so file: /jni/x86/", "");
      x86.add(name);
      all.add(name);
    } else if ((item as String).contains("/x86_64/")) {
      var name = item.replaceFirst("find so file: /jni/x86_64/", "");
      x86_64.add(name);
      all.add(name);
    } else if ((item as String).contains("/arm64-v8a/")) {
      var name = item.replaceFirst("find so file: /jni/arm64-v8a/", "");
      arm64.add(name);
      all.add(name);
    } else {
      print(item);
    }
  }
  all = all.toSet().toList();
  HashMap<String, String> allMap = new HashMap();
  for (var item in all) {
    allMap.putIfAbsent(item, () => "");
  }

  for (var item in arm) {
    allMap.update(item, (value) {
      if (value.isEmpty) {
        return "arm";
      }
      return value += ",arm";
    });
  }
  for (var item in v7a) {
    allMap.update(item, (value) {
      if (value.isEmpty) {
        return "v7a";
      }
      return value += ",v7a";
    });
  }

  for (var item in arm64) {
    allMap.update(item, (value) {
      if (value.isEmpty) {
        return "arm64";
      }
      return value += ",arm64";
    });
  }
  for (var item in x86) {
    allMap.update(item, (value) {
      if (value.isEmpty) {
        return "x86";
      }
      return value += ",x86";
    });
  }
  for (var item in x86_64) {
    allMap.update(item, (value) {
      if (value.isEmpty) {
        return "x86_64";
      }
      return value += ",x86_64";
    });
  }

  allMap.forEach((key, value) {
    print("$key - $value");
  });
}
```

## 三.分类

通过上文的工具类，我得到了如下的输出，同时通过查找`v7a,arm64`文本就可以快速定位到，那个so库是缺少了

```shell
# 未统计
find so file: /jni/mips/librealm-jni.so
find so file: /jni/mips/libopustool.so
find so file: /jni/mips64/libopustool.so

# 缺少arm64-v8a
libAgoraMediaPlayer.so - v7a
libagora-rtc-sdk-jni.so - v7a
libagora-crypto.so - v7a
libapm-packet-processing-jni.so - v7a
libapm-plugin-agora-rtc-player.so - v7a

# 齐全
librealm-jni.so - v7a,arm64,x86,x86_64
libsgsecuritybody.so - v7a,arm64
libALBiometricsJni.so - v7a,v7a,arm64
libflipper.so - v7a,arm64,x86,x86_64
libopustool.so - arm,v7a,arm64,x86,x86_64
libQPlayer.so - v7a,arm64,x86
libsgmiddletier.so - v7a,arm64
libweibosdkcore.so - arm,v7a,arm64
libc++_shared.so - v7a,v7a,v7a,arm64,arm64,arm64,x86,x86,x86_64,x86_64
libtnet-3.1.14.so - arm,v7a,arm64,x86,x86_64
libevent-2.1.so - v7a,arm64,x86,x86_64
libmarsxlog.so - v7a,arm64
libmmkv.so - arm,v7a,arm64,x86,x86_64
libglide-webp.so - v7a,arm64,x86,x86_64
libauth_number_product-2.12.3.4-log-online-standard-release_alijtca_plus.so - arm,v7a,arm64,x86
libsgmain.so - v7a,arm64
libevent_core-2.1.so - v7a,arm64,x86,x86_64
libevent_extra-2.1.so - v7a,arm64,x86,x86_64
libsgmainso-5.5.28.so - v7a,arm64
libsgsecuritybodyso-5.5.28.so - v7a,arm64
libfbjni.so - v7a,arm64,x86,x86_64
libsharewind.so - arm,v7a,arm64
libsecsdk.so - arm,v7a,arm64,x86,x86_64
libumeng-spy.so - arm,v7a,arm64,x86
libalicomphonenumberauthsdk_core.so - arm,v7a,arm64,x86
libqcOpenSSL.so - v7a,arm64,x86
```

以上是我已经修改过很多库之后的结果，只剩下了声网库需要加上64位，直接加入即可

## 四.小技巧

### 1.确定某个so是属于那个库

```groovy
// 可以通过注释掉裁切name的代码
def printDir(File file) {
    if (file != null) {
        if (file.isDirectory()) {
            file.listFiles().each {
                printDir(it)
            }
        } else if (file.absolutePath.endsWith(".so")) {
            def name = file.absolutePath
            //def index = name.indexOf("/jni/")
            //name = name.substring(index)
            println "find so file: $name"
        }
    }
}
```

会得到如下输出：

`find so file: /Users/wangzhumo/.gradle/caches/transforms-2/files-2.1/ac6b144ab5bc894b10f09dde5796e394/jetified-flipper-0.114.0/jni/x86_64/libevent-2.1.so`

基本上可以通过`jetified-flipper-0.114.0`得出结论，如果还不明确，直接去对应目录找即可

### 2.善用Github（备用方案）

可以直接去github搜索，如果能找到对应版本so，可以直接使用

### 3.趁机升级库版本

加入64位支持后，需要全版本测试，可以随便升级库版本

- 一些库加入了 `隐私协议`相关支持
- 加入了android12的支持
- 修复了一些bug

## 五.确认结果

最后我们需要打一个release包，并查看其中so的结构

> arm64-v8a
> 
> armeabi-v7a

```shell
.
├── lib
    ├── arm64-v8a
    │   ├── libALBiometricsJni.so
    │   ├── libAgoraMediaPlayer.so
    │   ├── .....
    │   ├── libumeng-spy.so
    │   └── libweibosdkcore.so
    └── armeabi-v7a
        ├── libALBiometricsJni.so
        ├── libAgoraMediaPlayer.so
        ├── .....
        ├── libumeng-spy.so
        └── libweibosdkcore.so
```

对比之后，确定没问题。