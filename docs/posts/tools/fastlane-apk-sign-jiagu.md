---
title: Android使用Fastlane打渠道包-签名-加固
lang: zh-CN
tags:
  - Tools
date: 2021-09-17
---

## 前言

Fastlane是一个集成工具，以前用来打flutter的工程，感觉比较好用，近期因为工程里的一个库和walle冲突，以前的打包方式就不适用了。

这里使用fastlane

- 获取channel信息
- 调用360加固宝进行加固并签名

<!-- more -->

也很简单，jenkins中调用fastlane -> channel信息写入文件 -> 360加固宝加固签名 -> fir上传

![image-20210119105954976](https://image.wangzhumo.com/2021/09/fastlane_dingding_apk.png)

## fastlane安装

文档：[fastlane docs](https://docs.fastlane.tools/)

#### macos

1.安装：

```shell
brew install fastlane

Warning: fastlane 2.163.0 is already installed and up-to-date
To reinstall 2.163.0, run `brew reinstall fastlane`

#我这里已经安装过了
```

2.工程中初始化fastlane

```shell
cd path/to/projectRootDir
# 创建一个Gemfile文件

vim ./Genfile 
# 文件中写入以下内容

source "https://rubygems.org"
gem "fastlane"

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
```

而后执行

` fastlane init`

3.根据引导填写工程的信息

```shell
Package Name (com.krausefx.app):  #填写自己的包名即可
Path to the json secret file:   #我这里不需要，直接跳过
Download existing metadata and setup metadata management? (y/n)  #不需要直接 n 回车
Continue by pressing Enter ⏎  # 回车即可
```

4.初始化完成

一段时间后初始化就成功了。

大概会增加目录结构是这样的

```shell
#项目根目录
.
├── Gemfile
├── fastlane
│   ├── Appfile
│   └── Fastfile
│
other #自己项目内容
```

## Channel信息

#### 参数传递

Jenkins 中选择channel【all】,【channel,channel2,channel3】，【channel】,三种传入样式都可以接收：

```shell
script[
     sh('fastlane android beta channel:${channels}')
]
```

通过这样的方式就可以传入到fastlane中了，但是同时我希望把本地文件中的一些信息也修改掉：

```groovy
android {
    compileSdkVersion COMPILE_SDK_VERSION as int

    defaultConfig {
        versionCode gitVersionCode()  //希望把这个改成具体的值
        versionName VERSION_NAME
        multiDexEnabled true
        multiDexKeepProguard file("multidexKeep.pro")
        multiDexKeepFile file("multidex-config.txt")

            manifestPlaceholders = [
                CHANNEL_VALUE : "Debug"  // 这里也修改掉
        ]
    }
```

那么我准备建立一个gradle Task来做这件事情，在fastlane的脚本里传入android这边

```shell
gradle(
       task: "assemble",
       build_type: "Debug",
       print_command: true,
       print_command_output: true,
       properties:{
          "BUILD_CHANNEL" => channelName
      }
)

# 最终执行的：
gradle assembleDebug -PBUILD_CHANNEL=channelName 
```

#### 写入文件

1.建立一个名为 `channel.gradle`的文件

2.添加这个文件到项目中`apply from:'channel.gradle'` 

3.编写channel.gradle

```groovy
// 修改App的VersionCode
task modifBuildCodeTask {
    // gradle文件
    def gradleFile = file("build.gradle")
    // 版本号
    def versionCode = gitVersionCode()
    // 全部文本
    def allBuffer = new StringBuffer()
    def channelString = project.hasProperty('BUILD_CHANNEL') ? BUILD_CHANNEL : "official"
    if (channelString.equals("all") || channelString.contains(",")) {
        channelString = "official"
    }
    // 读取每一行
    gradleFile.eachLine { line, course ->
        if (line.contains("versionCode")) {
            int index = line.indexOf("versionCode")
            allBuffer.append(line, 0, index + "versionCode".length())
            allBuffer.append(" " + versionCode)
            allBuffer.append(System.lineSeparator())
        } else if (line.contains("CHANNEL_VALUE")) {
            int index = line.indexOf("CHANNEL_VALUE")
            allBuffer.append(line, 0, index + "CHANNEL_VALUE".length())
            allBuffer.append(" : ").append('"' + channelString + '"')
            allBuffer.append(System.lineSeparator())
        } else {
            allBuffer.append(line).append(System.lineSeparator())
        }
    }
    // 写流
    def printWriter = gradleFile.newWriter()
    printWriter.write(allBuffer.toString())
    printWriter.flush()
    printWriter.close()
}

static def gitVersionCode() {
    def cmd = 'git rev-list HEAD --count'
    cmd.execute().text.trim().toInteger()
}


task modifyChannelInfoTask {
    // 获取外部传入的channel信息
    def channelString = project.hasProperty('BUILD_CHANNEL') ? BUILD_CHANNEL : "official"
    List<String> channelList
    if (channelString.equals("all")) {
        //则读取本地channel下的所有channel
        // channel文件
        def channelFile = file("channel")
        channelList = channelFile.readLines()
    } else {
        // 修改本地的channel列表
        channelList = channelString.split(",")
    }
    print("打包渠道：")
    println(channelList)
    // 写入到 channels 中的channels.txt
    def path = rootDir.getAbsolutePath() + File.separator + "channels/channels.txt"
    File file = new File(path)
    def printWriter = file.newWriter()
    channelList.forEach {
        printWriter.append("INYUAPP_CHANNEL").append(" ").append(it).append(" ").append(it).append(System.lineSeparator())
    }
    printWriter.flush()
    printWriter.close()
}
```

那么当我每次编译的时候，这里都会执行，从而修改对应的文件，这一步修改：

1.`build.gradle`中的 `CHANNEL_VALUE` 以及 `versionCode`的值

2.把需要打的渠道写入到 rootDir - channels - channel.txt 中，而后360加固宝读取这个

## 加固并打包

这一步直接调用360加固宝即可，为此我们编写一个sh

```shell
#!/bin/zsh

# 360加固宝的用户/密码
USER="xxxxx"
PSSSWORD="xxxxx"
PARENT_PATH=$(cd ../ && pwd)

JIAGU_JAVA=$3
JIAGU_ROOT=$2

# 签名相关信息
keystore_password="xxxx"
alias_password="xxxx"
alias="xxxx"
keystore_path="${PARENT_PATH}/modules/module_app/liuliu.keystore"
# 加固多渠道模板
CHANNEL_PATH="${PARENT_PATH}/channels/channels.txt"

# 输入apk包地址
INPUT_APK=$1

# 输出地址
OUTPUT_APK="${PARENT_PATH}/channels/apks/"


# 登录
function login360() {
  "$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -login $USER $PSSSWORD
}


# 导入签名信息
function importkeyStore() {
  "$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -importsign "$keystore_path" $keystore_password $alias $alias_password
  "$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -showsign
}

# 导入渠道信息
function importChannels() {
  "$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -importmulpkg "$CHANNEL_PATH"
  "$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -showmulpkg
}

function configJiagu() {
  "$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -config
  "$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -showconfig
}



login360
importkeyStore
importChannels
configJiagu
"$JIAGU_JAVA" -jar "$JIAGU_ROOT"/jiagu.jar -jiagu "$INPUT_APK" "$OUTPUT_APK" -autosign -automulpkg -pkgparam "$CHANNEL_PATH"
```

这个脚本通过 `bash jiagu.sh {path/to/apk} {path/to/jiagubao-java} {path/to/jiagubao-roodir} ` 执行即可

## 钉钉通知（自定义fastlane Action）

为了更方便的获取到打包的信息，方便获取测试包，还需要一个打包成功的通知

这里我通过钉钉的`webhook`功能，从fastlane中发出通知

> Action - notification_dingtalk

## fastlane组装整个打包流程

```ruby
default_platform(:android)

platform :android do
  puts "---------------set apk info start-----------------"
  # 设置App名称
  apk_name = "xxx";
  puts "---------------set apk info end-----------------"

  timestamp = FastlaneCore::CommandExecutor.execute(command: "date +%s")


  desc "build a debug version apk"
  lane:beta do |options|
      puts "---------------build debug version start-----------------"
      # gradle build
      # clean
      gradle(task:"clean")

      channelName=options[:channel]
      if channelName.nil?
        channelName="official"
      end

      # build
      gradle(
          task: "assemble",
          build_type: "Debug",
          print_command: true,
          print_command_output: true,
          properties:{
            "BUILD_CHANNEL" => channelName
          }
      )
      puts "---------------build debug version end-----------------"

      puts("---------------print debug apk info start-----------------")
      app_info

        app_info_json = JSON.parse(ENV['APP_INFO'])

      # 获取版本名称
      version_name = app_info_json['ReleaseVersion'];
      # 获取版本号
      version_code = app_info_json['BuildVersion'];

      # 默认的apk地址名字
      apk_file_path=lane_context[SharedValues::GRADLE_APK_OUTPUT_PATH]
      apk_name=apk_name+ "-debug-" + version_code + "-" + timestamp + ".apk"
      apk_path=""
      Dir.chdir("../channels/input/") do
        apk_path=Dir.pwd
      end
      apk_path=apk_path + "/#{apk_name}"
      sh("mv #{apk_file_path} #{apk_path}")
      puts("---------------print debug apk info end-----------------")

      # 上传
      timestamp_string = FastlaneCore::CommandExecutor.execute(command: "date")
      fir_result = fir_cli api_token: "xxxxxx",specify_file_path: "#{apk_path}",  changelog: "#{timestamp_string}"

      UI.message "#{fir_result}"

        # 钉钉通知
      notification_dingtalk(uploadUrl:fir_result[:short],buildType:"Debug")

      say("Android打包完成")
      notification(title: "Android debug build success", message: "Apk Path：" + apk_path);
  end
end  
```

其中用到的插件：

```shell
+------------------------------------------------+---------+----------------------------------------------+
| Plugin                                         | Version | Action                                       |
+------------------------------------------------+---------+----------------------------------------------+
| fastlane-plugin-app_info                       | 0.3.0   | app_info                                     |
| fastlane-plugin-android_versioning             | 0.5.3   | get_value_from_build increment_version_code  |
|                                                |         | set_value_in_build get_version_name          |
|                                                |         | increment_version_name get_version_code      |
| fastlane-plugin-android_change_string_app_name | 0.1.1   | android_change_string_app_name               |
| fastlane-plugin-fir_cli                        | 2.0.11  | fir_cli                                      |
+------------------------------------------------+---------+----------------------------------------------+
```