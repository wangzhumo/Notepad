---
title: Android Studio 缓存目录地址
lang: zh-CN
tags:
  - Android Studio
date: 2020-10-06
---

## Gradle

#### Dir:
~/.gradle

#### Config

~/.gradle/config

<!-- more -->

## Android SDK 工具

#### Android 模拟器(AVDs) and *.keystore 文件

~/.android

#### SDK

~/Library/Android/Sdk

#### NDK

~/Library/Android/Sdk/ndk-bundle


## Clear Cache

rm -Rf /Applications/Android\ Studio.app

rm -Rf ~/Library/Preferences/AndroidStudio*

rm -Rf ~/Library/Preferences/com.google.android.studio.plist

rm -Rf ~/Library/Application\ Support/AndroidStudio*

rm -Rf ~/Library/Logs/AndroidStudio*

rm -Rf ~/Library/Caches/AndroidStudio*