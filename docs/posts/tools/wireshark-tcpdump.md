---
title: WireShark与tcpdump的入门使用记录
lang: zh-CN
tags:
  - Protocol
  - Wireshark
date: 2021-09-17
---

在我们开发的过程中,需要查看网络传输过程的信息，在我平时的开发中,移动端仅仅使用Charles就已经能满足我所有需要了,而在音视频的开发过程中,RTC,RTCP,Offer,Answer中的sdp以及信令服务中的socket都不能简单的使用Charles,需要更加底层的工具.

<!-- more -->

这时候就是WireShark大显身手的时候,tcpdump的输出文件也是可以用WireShark来查看的,这里我仅仅简单的记录一些使用方式,等到我慢慢的深入使用以后,再进行更深层的记录.

## tcpdump

`tcpdump -i eth0 src port 80 -xx -Xs 0 -w test.cap`

- i 指定网卡
- src  指定包的来源
- port 指定端口号
- xx 抓取到的包使用16进制显示
- X 以ASCII码显示
- s 0  抓取的包无限制,也就是抓取所有包
- w    写入到文件中

## wireshark

### 逻辑运算

- 与 : and 或者 &&
- 或 : or 或者 ||
- 非 : not 或者 !

### 判断

- 等于 : eq 或 ==
- 大于 : gt 或 >
- 小于 : lt 或 <
- 小于等于 : le 或者 <=
- 大于等于 : ge 或者 >=
- 不等于 : ne 或 !=

### 协议过滤

- stun
- udp
- tcp
- arp
- icmp
- http
- smtp
- ftp
- dns
- msnms
- ssl
- oicq

### 按照http过滤

- http.request.method == "GET"
- http.request.method == "POST"
- http.request.uri == "/img/logo.png"
- http contains "GET"
- http contains "HTTP/1."

### 按IP过滤

- ip.dst == 192.168.1.1
  发送到的目的IP

- ip.src == 192.168.2.13
  源IP

- Ip.addr == 192.168.2.23
  所有该IP的通信, 源IP + 目的IP

### 按Port过滤

- tcp.port == 8080
- udp.port == 8080
- udp.dstport == 8080
- udp.srcport == 8080

### 按长度过滤

- udp.length < 20
- tcp.length < 30
- http.content_length < 100