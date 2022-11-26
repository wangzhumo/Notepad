---
title: Netty中LengthFieldBasedFrameDecoder的使用
lang: zh-CN
tags:
  - Protocal
date: 2021-02-17  
---

## 前言

对于Netty中`LengthFieldBasedFrameDecoder`使用，其实就是把我们自己对byte[]的解析操作封装起来了，而后它解析过的数据，还是会传递到下一级的handler，供我们自己是使用，而`LengthFieldBasedFrameDecoder`参数比较多，也不是很便于理解，我这里将自己理解的内容记录下来。

<!-- more -->

## Protocol Decoder

常用的几个解析消息的Decoder

- **LineBasedFrameDecoder**
  
  通过在包尾添加换行符 \r\n 来区分整包消息
  
  如果是自己发送的话，建议不要自己拼接`“\r\n”`，最好使用系统提供的

- **DelimiterBasedFrameDecoder**
  
  特殊字符作为分隔符
  
  这种就是你自己和服务器约定了一个特殊的字段，作为分隔

- **FixedLengthFrameDecoder**
  
  定长的消息，不够指定的长度，则空格补全

- **LengthFieldBasedFrameDecoder**
  
  这个是我们即将要使用的，他是对**不定长**但是消息中携带**长度信息**的协议解析的
  
  > [netty源码分析之LengthFieldBasedFrameDecoder - 简书 (jianshu.com)](https://www.jianshu.com/p/a0a51fd79f62)
  
  这位大哥讲的比较清楚的，可以参考

## 自定义消息协议

假设如下就是我们的Header + Body 的字节结构：

```shell
  0 1 2 3 4 5 6 7 8               16              24
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+<+
  |O| CP| V | PL  |      MM       |      MM       | 
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                   Header                      |   Body
```

- Lenght
  
  - 其中`V`代表的是`Length`属性，从`3`字节的位置写入，长度为`2`字节
  
  - `V`代表的`Lenght`标记的是`body`的长度
    
    举个例子：
    
    ```shell
    body = ""  
    V = 0   代表的是body没有长度
    
    body = "1"
    V = body.getBytes().length();
    ```

- Header 整个Header长度是`24`

> 本文中所有的字节序均为小端

## 源码解析

> LengthFieldBasedFrameDecoder

#### 构造函数

```java
  /**
     * Creates a new instance.
     *
     * @param byteOrder
     *        the {@link ByteOrder} of the length field
     * @param maxFrameLength
     *        the maximum length of the frame.  If the length of the frame is
     *        greater than this value, {@link TooLongFrameException} will be
     *        thrown.
     * @param lengthFieldOffset
     *        the offset of the length field
     * @param lengthFieldLength
     *        the length of the length field
     * @param lengthAdjustment
     *        the compensation value to add to the value of the length field
     * @param initialBytesToStrip
     *        the number of first bytes to strip out from the decoded frame
     * @param failFast
     *        If <tt>true</tt>, a {@link TooLongFrameException} is thrown as
     *        soon as the decoder notices the length of the frame will exceed
     *        <tt>maxFrameLength</tt> regardless of whether the entire frame
     *        has been read.  If <tt>false</tt>, a {@link TooLongFrameException}
     *        is thrown after the entire frame that exceeds <tt>maxFrameLength</tt>
     *        has been read.
     */
    public LengthFieldBasedFrameDecoder(
            ByteOrder byteOrder, int maxFrameLength, int lengthFieldOffset, int lengthFieldLength,
            int lengthAdjustment, int initialBytesToStrip, boolean failFast) {
        this.byteOrder = checkNotNull(byteOrder, "byteOrder");
        checkPositive(maxFrameLength, "maxFrameLength");
        checkPositiveOrZero(lengthFieldOffset, "lengthFieldOffset");
        checkPositiveOrZero(initialBytesToStrip, "initialBytesToStrip");
        if (lengthFieldOffset > maxFrameLength - lengthFieldLength) {
            throw new IllegalArgumentException(
                    "maxFrameLength (" + maxFrameLength + ") " +
                    "must be equal to or greater than " +
                    "lengthFieldOffset (" + lengthFieldOffset + ") + " +
                    "lengthFieldLength (" + lengthFieldLength + ").");
        }
        this.maxFrameLength = maxFrameLength;
        this.lengthFieldOffset = lengthFieldOffset;
        this.lengthFieldLength = lengthFieldLength;
        this.lengthAdjustment = lengthAdjustment;
        this.lengthFieldEndOffset = lengthFieldOffset + lengthFieldLength;
        this.initialBytesToStrip = initialBytesToStrip;
        this.failFast = failFast;
    }
```

- byteOrder 字节序，我这里是`ByteOrder.LITTLE_ENDIAN`小端

- maxFrameLength 最大字节数，和服务器约定即可

- lengthFieldOffset 这个指的是你的长度字段在消息**整包中**的开始位置
  
  - Length 属性在最开头 `0`即可
  - Length 不在最开头 那么填写它在**整包中**的偏移量即可，就像我这里是 `3`

- lengthFieldLength Length属性的自身的【字节】长度，我这里是`2`字节，也就是个`short`类型

- lengthAdjustment 这个属性是一个比较难理解的东西，在后面详细说明

- initialBytesToStrip 截取，如果说你不想要某一段数据，直接截取即可，从整包的0位置开始算

用我自定义的消息协议，在这里的参数就应该是（后面讲如何计算）：

```java
LengthFieldBasedFrameDecoder(
           ByteOrder.LITTLE_ENDIAN,1024,3,2,19,0,true
)
// ByteOrder.LITTLE  小端
// 1024    最大长度
// 3       length属性开始的位置
// 2       length属性的长度，我这里是short,那就是2字节
// 19      就是说，从length往后还需要读取 19 个字节
// 0       不截取任何数据
// true    TooLongFrameException的异常
```

#### decode函数

```java
 /**
     * Create a frame out of the {@link ByteBuf} and return it.
     *
     * @param   ctx             the {@link ChannelHandlerContext} which this {@link ByteToMessageDecoder} belongs to
     * @param   in              the {@link ByteBuf} from which to read data
     * @return  frame           the {@link ByteBuf} which represent the frame or {@code null} if no frame could
     *                          be created.
     */
protected Object decode(ChannelHandlerContext ctx, ByteBuf in) throws Exception {
        if (discardingTooLongFrame) {
            discardingTooLongFrame(in);
        }
        if (in.readableBytes() < lengthFieldEndOffset) {
            return null;
        }
        // 1.为了开始读取length，需要计算Length属性，实际上在ByteBuf中的位置
        // 实际位置 = 第一个可以读取的位置Index  +  Length属性在整包中的偏移量
        int actualLengthFieldOffset = in.readerIndex() + lengthFieldOffset;

        // 2.这一步读取Length的值，最终的目的是计算出这个Frame的消息整包长度
        // 因为我的协议中Length的值是body.length
        // Frame实际的长度 = Length的值（body长度） + 24（Header长度）
        long frameLength = getUnadjustedFrameLength(in, actualLengthFieldOffset, lengthFieldLength, byteOrder);
        if (frameLength < 0) {
            failOnNegativeLengthField(in, frameLength, lengthFieldEndOffset);
        }

        // 3.这里就是  Length的值（Body长度） +  Length属性结束的位置
        // lengthFieldEndOffset 的定义在上面的构造中 
        // lengthFieldEndOffset = lengthFieldOffset + lengthFieldLength;
        // 我们要明白的是，它的目的就是确定Frame整包的长度
        frameLength += lengthAdjustment + lengthFieldEndOffset;
        if (frameLength < lengthFieldEndOffset) {
            failOnFrameLengthLessThanLengthFieldEndOffset(in, frameLength, lengthFieldEndOffset);
        }
        if (frameLength > maxFrameLength) {
            exceededFrameLength(in, frameLength);
            return null;
        }
        // never overflows because it's less than maxFrameLength
        int frameLengthInt = (int) frameLength;
        if (in.readableBytes() < frameLengthInt) {
            return null;
        }
        if (initialBytesToStrip > frameLengthInt) {
            failOnFrameLengthLessThanInitialBytesToStrip(in, frameLength, initialBytesToStrip);
        }
        in.skipBytes(initialBytesToStrip);
        // extract frame
        int readerIndex = in.readerIndex();

        // 4.这里确定你需要的字节长度
        // 为什么说是“你需要的”  因为initialBytesToStrip如果设置的话，会发生截取
        // 截取范围是 [0,initialBytesToStrip]
        int actualFrameLength = frameLengthInt - initialBytesToStrip;

        // 5.这里取出你指定需要的Frame数据
        ByteBuf frame = extractFrame(ctx, in, readerIndex, actualFrameLength);
        in.readerIndex(readerIndex + actualFrameLength);
        return frame;
}
```

## 计算`lengthAdjustment`

除`lengthAdjustment`之外，其他的参数都是协议中可以直接确定的数据，就不赘述了

通过阅读Decode方法，我们注意到注释3 中，`frameLength`的计算方式，`lengthAdjustment` ，`lengthFieldEndOffset`会被加上去

那么怎么计算出`lengthAdjustment`的值呢？我们先来明确各个属性的含义

- frameLength 消息整包的长度
- lengthFieldEndOffset Length属性结束的位置
- lengthAdjustment 一个帮你调整`frameLength`得到正确总长度的参数

> 这里舍弃从含义去分析，只通过数学的方式去计算lengthAdjustment

### 两种Lenght

#### Lenght是整个消息的长度

那么 `frameLength` 读取到`Length`的值后，就已经是正确的了，它已经满足**消息的总长度**

1.但是注释3 中，它又被加上了 `lengthFieldEndOffset` 以及 `lengthAdjustment`

而 `lengthFieldEndOffset` = `lengthFieldOffset` + `lengthFieldLength`

2.所以我们要做的就是满足 `lengthFieldEndOffset` + `lengthAdjustment` = 0

那么`lengthAdjustment` = 0 - `lengthFieldOffset` -`lengthFieldLength`

3.假设我这里的 Length 的值是 Header.length + body.length

**`lengthAdjustment` = 0 - `lengthFieldOffset` - `lengthFieldLength` = 0 - 3 -2 = -5**

#### Lenght的值只代表Body长度

那么 `frameLength` 读取到`Length`的值后，仅仅代表了 Body的长度，并不能满足**消息的总长度**

1.还缺少了Header.length，header的长度是定长`24`，那么

`lengthFieldEndOffset` + `lengthFieldLength` 就要等于 Header的长度 = 24

2.那么`lengthAdjustment` = 24 - `lengthFieldOffset` - `lengthFieldLength`

**`lengthAdjustment` = 24 - `lengthFieldOffset` - `lengthFieldLength` = 24- 3 -2 = 19**
