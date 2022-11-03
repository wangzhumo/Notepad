---
title: WebSocket的使用笔记-理论基础
lang: zh-CN
tags:
  - WebSocket
  - WebRTC
date: 2021-09-17
---

## 前言

WebSocket 是HTML5一种新的web通信技术,实现了浏览器与服务器的全双工实时通信(full-duplex),在WebSocket中,第一次还是采用Http的形式来通知服务器,准备使用WebSocket的协议,而如果服务器支持的话,会返回成功的通知101,而后就会长连接来进行全双工的通信,而不是Request & Response,每一次请求完成都断开连接.
因此,WebSocket通常是使用在推送,即时通讯,等等需要即时性的通讯需求.

<!-- more -->

#### [Wiki](https://zh.wikipedia.org/wiki/WebSocke)

> WebSocket 是独立的、创建在 TCP 上的协议.  WebSocket使得客户端和服务器之间的数据交换变得更加简单，允许服务端主动向客户端推送数据。在WebSocket API中，浏览器和服务器只需要完成一次握手，两者之间就直接可以创建持久性的连接，并进行双向数据传输。

## WebSocket简介

我们先来看一张图:
额,再来一张:
先说第二张图,说明了WebSocket与Http的关系,其实两者除了都是基于TCP之外联系并不大,只是WebSocket的第一次握手申请升级协议的时候使用了Http的连接,而后的各种连接都是使用WebSocket的.
再来说第一张图,主要揭示了WebSocket的工作流程,通过握手后双方启用了WebSocket通信,而之后的一系列操作都是WebSocket自己来操作的.

#### WebSocket客户端第一次请求

```tex
GET ws://echo.websocket.org/?encoding=text HTTP/1.1

Origin: http://websocket.org

Cookie: __utma=99as

Connection: Upgrade

Host: echo.websocket.org

Sec-WebSocket-Key: uRovscZjNol/umbTt5uKmw==

Upgrade: websocket

Sec-WebSocket-Version: 13
```

这是WebSocket第一次发送的请求,只支持GET请求

- Upgrade 主要表明我需要升级协议,其后标明了需要升级的协议类型
- Sec-WebSocket-Key  则是WebSocket 客户端发送的一个 base64 编码的密文,需要服务器端返一个对应加密Sec-WebSocket-Accept应答,如果不合法则抛出Error during WebSocket handshake错误,并关闭连接

#### WebSocket服务器返回

```tex
HTTP/1.1 101 WebSocket Protocol Handshake

Date: Fri, 10 Feb 2012 17:38:18 GMT

Connection: UpgradeServer: Kaazing Gateway

Upgrade: WebSocket

Access-Control-Allow-Origin: http://websocket.org

Access-Control-Allow-Credentials: true

Sec-WebSocket-Accept: rLHCkw/SKsO9GAH/ZSFhBATDKrU=

Access-Control-Allow-Headers: content-type
```

- Sec-WebSocket-Key的内容加上字符串258EAFA5-E914-47DA-95CA-C5AB0DC85B11
- 生成的字符串进行SHA1编码
- 再将生成的字符串进行Base64编码

## WebSocket通信

WebSocket中所有数据均使用帧的形式发送。

客户端发送的数据帧都要经过掩码处理,服务端发送的所有数据帧都不能经过掩码处理,否则对方需要发送关闭帧。  一个帧包含一个帧类型的标识码,一个负载长度,和负载(包括扩展内容和应用内容)

### WebSocket数据帧的统一格式

```xml
  0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 |     Extended payload length continued, if payload len == 127  |
 + - - - - - - - - - - - - - - - +-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------- - - - - - - - - - - - - - - - +
 :                     Payload Data continued ...                :
 + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+
```

#### FIN  1个比特。

如果是1,表示这是消息的最后一个分片,若是0表示不是最后一个
RSV1, RSV2, RSV3各占1个比特
这三个都是留着扩展用的

#### Opcode 4个比特

- 0 表示此帧是一个继续帧,需要拼接在上一个收到的帧,组成一个完整的消息,所以非控制帧的发送和接收必须是相同的顺序
- 1 文本帧
- 2 二进制帧
- 3 - 7 保留
- 8 关闭连接控制帧
此帧可能会包含内容,以表示关闭连接的原因,注意必须是客户端与服务器端成对出现,而后关闭链接.
- 9 Ping类似于心跳,收到Ping之后应立即发送Pong响应
- 10 Pong
如果通信一方并没有发送Ping,但是收到了Pong,并不要求它返回任何信息
- 11 - 15 保留

#### Mask  1个比特

表示是否要对数据载荷进行掩码操作

#### Payload length

7bit 数据的长度, length == 126 时,后面的2 个字节也是表示数据长度
当它 length == 127 时,后面的 8 个字节表示数据长度

#### Masking-key 0或4字节

主要看Mask的值来决定

#### Payload data   扩展数据+应用数据

应用数据,在扩展数据之后,帧数据的剩余长度就是应用数据的长度.

## WebSocket保持心跳

WebSocket保持客户端,服务端的实时双向通信,需要确保客户端,服务端之间的TCP连接没有断开。
但是又不能一直去发送数据,这样的话会浪费大量的资源.
此时就是心跳来保持连接:

- 发送方  ping     opcode =  9
- 接收方  pong   opcode =  A

## WebSocket的使用

这一部分我准备用另一篇笔记来记录

## OkHttp

这里单独说一下okhttp,竟然支持websocket的通信协议,而且还有一个扩展模块mockserver支持测试..简直完美

> implementation "com.squareup.okhttp3:okhttp:$okhttpVersion"
> implementation "com.squareup.okhttp3:mockwebserver:$okhttpVersion"

### Java-websocket

Java-WebSocket,这是使用java来实现的WebSocket客户端和服务端,也是6的飞起.