---
title: TextView中的文字颜色,点击,斜体等实现--SpannableString
lang: zh-CN
tags:
  - Android
date: 2018-12-02
---

## 

## Html实现方式如下:

```java
String html = "文字<font color=\"red\">变色</font>的效果";
tvMainShow.setText(Html.fromHtml(html));
```

使用Html的方式来实现,简单的还好,复杂一点的真的很不方便

<!-- more -->

Google显然早就已经想到了这样的问题,所以  

> [SpannedString](https://developer.android.com/reference/android/text/SpannedString.html) & [SpannableStringBuilder](https://developer.android.com/reference/android/text/SpannableStringBuilder.html) 就是干这个的

他们都实现了 [CharSequence](https://developer.android.com/reference/java/lang/CharSequence.html),眼熟么?  `setText(CharSequence text)`.

#### 两个的区别:

> This is the class for text whose content is immutable but to which markup objects can be attached and detached. For mutable text, see SpannableStringBuilder

- 是CharSequence是固定长度的,一旦通过 new SpannableString("设置文字");则不可以更改文字内容,

- SpannableStringBuilder是可以的
  
  个人理解比较像String 和 StringBuilder 的关系

## SpannableString的使用:

#### 1.设置文字

`SpannableString spannableString = new SpannableString("文字的前景色与背景色");`

#### 2.通过setSpan来修改文字的样式

```
setSpan(Object what, int start, int end, int flags)
```

![span_setspan_image](https://image.wangzhumo.com/2021/09/span_setspan_image.png)

##### flags:

- Spannable.SPAN_EXCLUSIVE_EXCLUSIVE    ：前后都不包括
- Spannable.SPAN_EXCLUSIVE_INCLUSIVE    ：前面不包括
- Spannable.SPAN_INCLUSIVE_EXCLUSIVE    ：前面包括
- Spannable.SPAN_INCLUSIVE_INCLUSIVE    ：前后都包括

例子如下:

![span_exclusive_inclusive](https://image.wangzhumo.com/2021/09/span_exclusive_inclusive.gif)

代码如下:

```
/*
 *
 * @author 王诛魔 2017/1/21 上午11:31
 * @e-mail  phyooos@163.com
 */
public class MainActivity extends AppCompatActivity {

    @BindView(R.id.edit_show)
    EditText etMainShow;
    @BindView(R.id.tab_view)
    TabLayout tabLayout;


    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        ButterKnife.bind(this);
        showText(Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        tabLayout.setOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                switch (tab.getPosition()) {
                    case 0:
                        showText(Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                        break;
                    case 1:
                        showText(Spannable.SPAN_EXCLUSIVE_INCLUSIVE);
                        break;
                    case 2:
                        showText(Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
                        break;
                    case 3:
                        showText(Spannable.SPAN_INCLUSIVE_INCLUSIVE);
                        break;
                }
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
            }
        });
    }

    /**
     * 展示文字
     */
    private void showText(int type) {
        //构造SpannableString
        SpannableString spanString = new SpannableString("这里是王诛魔的简书文章");
        //字体颜色的Span
        ForegroundColorSpan span = new ForegroundColorSpan(Color.RED);
        //指定范围
        spanString.setSpan(span, 3, 6, type);
        //设置给EditText显示出来
        etMainShow.setText(spanString);
    }
}
```

上面的代码中:

- 字体颜色的Span
  ForegroundColorSpan span = new ForegroundColorSpan(Color.RED);
  ForegroundColorSpan就是设置的文字样式,这个是前景色,也就是字体的颜色

- 指定范围
  spanString.setSpan(span, 3, 6, type);
  这里的三个参数已经在上面说过了,通过上面的代码也会发现,其实3,6 其中下标3是包含的,而下标6就不会改变

## Span的实现类

**关键词:[CharacterStyle](https://developer.android.com/reference/android/text/style/CharacterStyle.html)**

![Span的一些类型.png](https://image.wangzhumo.com/2021/09/2520304-50978874ad4c3a7f.png)

说几个常用的吧:

- ForegroundColorSpan  字体颜色

- BackgroundColorSpan 字体背景色设置

- AbsoluteSizeSpan 字体大小

- StyleSpan 粗体等
  
  ```
  //字体由Typeface来控制
  StyleSpan span = new StyleSpan(Typeface.BOLD_ITALIC);
  ```

- UnderlineSpan 下划线

- ImageSpan 图片置换
  
  这个有一点不同,它是将文字中的指定部分替换为一个图片,至于如何构造请参考文档
  让我想起来了那个EmojiEditText的库,其实可以用这个ImageSpan实现一个简单的可以显示表情的TextView

- ClickableSpan 点击
  
  一般还需要设置TextView
  
  `TextView.setMovementMethod(LinkMovementMethod.getInstance());`

- URLSpan 这个完全可以用ClickableSpan实现
