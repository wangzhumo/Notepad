---
title: Android中使用注解
lang: zh-CN
tags:
  - Android
date: 2021-12-02
---

## 前言

@Override 就是一个很常见的注解.

1. 检查是否正确的复写父类方法
2. 标志是重写方法

<!-- more -->

**元注解**

元注解是,额,嗯 注解的注解

- @Retention：注解生命周期
- @Target：作用范围
- @Inherited：标明所修饰的注解类型是被继承的,子类会继承这个注解
- @Documented：javadoc

这些都是由Java语言本身提供的最基础的注解,他们负责注解其他的注解,具体的作用见上文

## 自定义注解

### 运行时注解(RUNTIME)

```java
/**
 * If you have any questions, you can contact by email {wangzhumoo@gmail.com}
 * @author 王诛魔 2018/8/9 上午10:50
 * 
 * 标记字段为imageUrl,图片地址
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface ImageUrl {
    String error() default "http://wangzhumo.com/css/images/avatar.png";
}


/**
 * If you have any questions, you can contact by email {wangzhumoo@gmail.com}
 * @author 王诛魔 2018/8/9 上午10:48
 * 
 * 标记字段为Content,内容
 */

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Content {

}
```

@ImageUrl  与 @Content  中都没有什么方法,这里只是使用标记的功能

为了体现标记的作用

```java
/**
 * If you have any questions, you can contact by email {wangzhumoo@gmail.com}
 *
 * @author 王诛魔 2018/8/9 上午10:47
 */
public class Whatever {

    public String haha;

    //瞎写的字段名,标记为正文
    @Content
    public String aaaa;

    //瞎写的字段名,标记为图片地址
    @ImageUrl(error = "http://wangzhumo.com/images/java_heap_stack.png")
    public String bajkfhajks;

    public String waht;

     /**
     * 自动生产
     *
     * @return List
     */
    public static List<Whatever> create() {
        List<Whatever> whatever = new ArrayList<>();
        for (int i = 0; i < 10; i++){
            //开始建立
            if (i==3){
                whatever.add(new Whatever(String.format(Locale.CHINA,"第%d个项目",i),""));
            }else{
                whatever.add(new Whatever(String.format(Locale.CHINA,"第%d个项目",i),"http://wangzhumo.com/css/images/avatar.png"));
            }
        }
        return whatever;
    }
}
```

在RecyclerView中使用

com.wangzhumo.playground.SimpleAdapter#onBindViewHolder

```java
@Override
public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
    try {
        for (Field field : getItem(position).getClass().getDeclaredFields()) {
            field.setAccessible(true);
            if (field.isAnnotationPresent(Content.class)) {
                holder.bindView.setContext((String) field.get(getItem(position)));
            } else if (field.isAnnotationPresent(ImageUrl.class)) {
                String imageUrl = (String) field.get(getItem(position));
                if (TextUtils.isEmpty(imageUrl)) {
                    ImageUrl url = field.getAnnotation(ImageUrl.class);
                    holder.bindView.setImageUrl(url.error());
                }else{
                    holder.bindView.setImageUrl(imageUrl);
                }
            }
        }
    } catch (IllegalAccessException e) {
        e.printStackTrace();
    }
}
```

`TextUtils.isEmpty(imageUrl)`简单的判断,是否设置了值,如果它没有值,那就直接使用 url.error() 中设置的值

![image_error](https://image.wangzhumo.com/2021/09/annotation_image_error.png)

在生成数据时,我给第4个位置的图片设置了`""`空值,则这里直接显示了我 @ImageUrl( error = "xxxxx")中设置的图片

如果我改造一下,设置GlideApp.with(imageUrl  ).error(@ImageUrl.error()) 可以成为一个很实用的方法

### 编译时注解(CLASS)

对于我个人来说,基本上没有这样的需要,但是如`Dagger2` 使用编译时注解 + APT 实现依赖注入

其他如`ARouter`,`BufferKnike`,`Glide`也会使用这样的技术.

如Glide

```java
package com.bumptech.glide.annotation.compiler;  //

public final class GlideAnnotationProcessor extends AbstractProcessor{

      @Override
    public synchronized void init(ProcessingEnvironment processingEnvironment) {
         super.init(processingEnvironment);
        //...
          //主要是初始化一些工具类啊什么的
      }

      @Override
      public Set<String> getSupportedAnnotationTypes() {
        //...
        //该方法中返回所有注解的类  
      }

      @Override
      public SourceVersion getSupportedSourceVersion() {
        return SourceVersion.latestSupported();
      }


      @Override
      public boolean process(Set<? extends TypeElement> set, RoundEnvironment env) {
        //...
        //这里是重要的部分,通过注释我们就能知道它大概做什么了
      }

}
```

1. 遍历得到需要解析的元素列表

2. 判断符合要求的元素

3. 修改,整理输出参数,或者借助APT生产代码等

如果你对这部分感兴趣,不妨选一个库看看
