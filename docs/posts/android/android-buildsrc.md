---
title: Android 使用BuildSrc作为统一依赖管理工具
lang: zh-CN
tags:
  - Android
date: 2020-12-02
---

## 一.各种依赖

### 1.Gradle

##### Gradle Plugin

`com.android.tools.build:gradle:7.0.0`

##### Gradle

`gradle-7.0.2-all.zip`

<!-- more -->

### 2.Java

```shell
./java -version                          
openjdk version "11.0.11" 2021-04-20
```

### 3.Kotlin

#### Kotlin Plugin

`1.5.21`

#### kotlin

```shell
kotlin -version 
Kotlin version 1.5.31-release-548 
```

## 二.创建文件

```shell
.
├── README.md
├── app
|
├── build.gradle
├── buildSrc
├── config.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
├── local.properties
├── ndk.gradle
└── settings.gradle
```

#### 1.Sync Now 或者重启Android Studio

#### 2.创建build.gradle.kts

```kotlin
import org.gradle.kotlin.dsl.`kotlin-dsl`

plugins {
    `kotlin-dsl`
}
repositories{
    google()
    mavenCentral()
}
```

#### 3.创建Libs.kt

```kotlin
package com.wangzhumo.app.buildsrc


object Versions {
    const val ktlint = "0.43.0"
    const val huawei = "1.5.2.300"
    const val kotlinPlugin = "1.5.21"
    const val gradlePlugin = "7.0.4"
}

object Classpath {
    const val androidGradlePlugin = "com.android.tools.build:gradle:${Versions.gradlePlugin}"
    const val kotlinGradlePlugin = "org.jetbrains.kotlin:kotlin-gradle-plugin:${Versions.kotlinPlugin}"
    const val hiltGradlePlugin = "com.google.dagger:hilt-android-gradle-plugin:2.28-alpha"
}

object Libs {
    const val jdkDesugar = "com.android.tools:desugar_jdk_libs:1.1.5"

    object AutoServer{
        private const val version = "1.0-rc7"
        const val auto_server = "com.google.auto.service:auto-service:$version"
        const val auto_server_annotations = "com.google.auto.service:auto-service-annotations:$version"
    }

    object Coil {
        const val coilCompose = "io.coil-kt:coil-compose:1.4.0"
    }
}
```

## 三.使用

在其他文件中使用时，记得导包

```
import com.wangzhumo.app.buildsrc.Libs

dependencies{
    implementation Libs.AndroidX.dynamicanimation
    implementation Libs.Google.hilt

    kapt Libs.ARouter.compiler
    kapt Libs.Google.hilt_compiler
}
```
