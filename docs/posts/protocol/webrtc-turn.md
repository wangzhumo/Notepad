---
title: WebRTC-TURN简介
lang: zh-CN
tags:
  - Protocal
  - WebRTC
date: 2021-09-17  
---

## TURN简介

Traversal Using Relays around NAT（TURN）：Relay Extensions to Session Traversal Utilities for NAT（STUN）
使用中继穿透NAT：STUN的中继扩展

- 解决STUN不能穿越NAT的情况,通过TURN中转
- 建立在STUN服务之上,消息格式使用STUN的规范
- TURN Client需要TURN服务提供一个公网IP以及Port用于接收/发送数据

<!-- more -->

## TURN中转

[https://tools.ietf.org/html/rfc5766#page-15](https://tools.ietf.org/html/rfc5766#page-15)

```
                                        Peer A
                                        Server-Reflexive    +---------+
                                        Transport Address   |         |
                                        192.0.2.150:32102   |         |
                                            |              /|         |
                          TURN              |            / ^|  Peer A |
    Client's              Server            |           /  ||         |
    Host Transport        Transport         |         //   ||         |
    Address               Address           |       //     |+---------+
   10.1.1.2:49721       192.0.2.15:3478     |+-+  //     Peer A
            |               |               ||N| /       Host Transport
            |   +-+         |               ||A|/        Address
            |   | |         |               v|T|     192.168.100.2:49582
            |   | |         |               /+-+
 +---------+|   | |         |+---------+   /              +---------+
 |         ||   |N|         ||         | //               |         |
 | TURN    |v   | |         v| TURN    |/                 |         |
 | Client  |----|A|----------| Server  |------------------|  Peer B |
 |         |    | |^         |         |^                ^|         |
 |         |    |T||         |         ||                ||         |
 +---------+    | ||         +---------+|                |+---------+
                | ||                    |                |
                | ||                    |                |
                +-+|                    |                |
                   |                    |                |
                   |                    |                |
             Client's                   |            Peer B
             Server-Reflexive    Relayed             Transport
             Transport Address   Transport Address   Address
             192.0.2.1:7000      192.0.2.15:50000     192.0.2.210:49191

                                 Figure 1
```

## TURN传输协议

```
           +----------------------------+---------------------+
           | TURN client to TURN server | TURN server to peer |
           +----------------------------+---------------------+
           |             UDP            |         UDP         |
           |             TCP            |         UDP         |
           |        TLS over TCP        |         UDP         |
           +----------------------------+---------------------+
```

TURN, as defined in this specification, always uses UDP between the server and the peer.  However, this specification allows the use of any one of UDP, TCP, or Transport Layer Security (TLS) over TCP to carry the TURN messages between the client and the server.

### TURN的Allocate

```
  TURN                                 TURN           Peer          Peer
  client                               server          A             B
    |-- Allocate request --------------->|             |             |
    |                                    |             |             |
    |<--------------- Allocate failure --|             |             |
    |                 (401 Unauthorized) |             |             |
    |                                    |             |             |
    |-- Allocate request --------------->|             |             |
    |                                    |             |             |
    |<---------- Allocate success resp --|             |             |
    |            (192.0.2.15:50000)      |             |             |
    //                                   //            //            //
    |                                    |             |             |
    |-- Refresh request ---------------->|             |             |
    |                                    |             |             |
    |<----------- Refresh success resp --|             |             |
    |                                    |             |             |

                                 Figure 2
```

Client发送一个Allocate到TURN服务 -> 权鉴 -> 成功应答(携带分配的IP:port)

Refresh request 就是保活

### TURN中转

> 这两种方式是可以同时使用的.

#### Send And Data

```
  TURN                                 TURN           Peer          Peer
  client                               server          A             B
    |                                    |             |             |
    |-- CreatePermission req (Peer A) -->|             |             |
    |<-- CreatePermission success resp --|             |             |
    |                                    |             |             |
    |--- Send ind (Peer A)-------------->|             |             |
    |                                    |=== data ===>|             |
    |                                    |             |             |
    |                                    |<== data ====|             |
    |<-------------- Data ind (Peer A) --|             |             |
    |                                    |             |             |
    |                                    |             |             |
    |--- Send ind (Peer B)-------------->|             |             |
    |                                    | dropped     |             |
    |                                    |             |             |
    |                                    |<== data ==================|
    |                            dropped |             |             |
    |                                    |             |             |

                                 Figure 3
```

Client Send

1. 客户端通过Send(Peer A) 到TURN服务,此时拿到其中的data(原始的udp数据)
2. 将data(原始的udp数据)直接转到Peer A

Client Data

1. TRUN中转需要发送到客户端的data,加入TURN头
2. 客户端收到了TURN服务中转的数据 Data

#### Channel

```
TURN                                 TURN           Peer          Peer
  client                               server          A             B
    |                                    |             |             |
    |-- ChannelBind req ---------------->|             |             |
    | (Peer A to 0x4001)                 |             |             |
    |                                    |             |             |
    |<---------- ChannelBind succ resp --|             |             |
    |                                    |             |             |
    |-- [0x4001] data ------------------>|             |             |
    |                                    |=== data ===>|             |
    |                                    |             |             |
    |                                    |<== data ====|             |
    |<------------------ [0x4001] data --|             |             |
    |                                    |             |             |
    |--- Send ind (Peer A)-------------->|             |             |
    |                                    |=== data ===>|             |
    |                                    |             |             |
    |                                    |<== data ====|             |
    |<------------------ [0x4001] data --|             |             |
    |                                    |             |             |

                                 Figure 4
```

我们使用Send / Data的方式,每次都需要传递一个30字节的数据头,耗费了我们的带宽

The client has already created an allocation and now wishes to bind a channel to Peer A

1. 发送一个绑定Channel的请求(channel id 16进制的数字)
2. 成功绑定
3. 直接发送data -> 中转 -> Peer

## TURN流程

1. STUN binding  
   
   发绑定请求,进行NAT的打通,服务拿到映射的地址

2. Caller TURN allocation
   
   allocation,让TURN分配一个可用的中继地址 ip:port

3. Caller send offer
   
   呼叫者通过信令,把自己的媒体,网络信息以SDP协议发送给对端

4. Callee(被呼叫者) TURN allocation
   
   被呼叫者也需要发送allocation,获取中继地址

5. Callee answer 
   
   被呼叫者通过信令,发送自己的信息

6. Exchange candidate IP address
   
   交换双方的信息candidate,可用的候选者地址

7. ICE check for P2P connection
   
   先检查效率最高的p2p连接

8. If P2P unsuccessful , make relay connection
   
   如果P2P不可用,则使用中继服务