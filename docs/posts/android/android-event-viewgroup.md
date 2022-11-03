---
title: Android事件分发机制-ViewGroup
lang: zh-CN
tags:
  - Android
date: 2020-12-01
---

## 总览

### 什么是事件分发

就是将系统传递过来的MotionEvent分发到某个具体的View,并处理这个MotionEvent的整个过程

我们先要明白

- 责任链模式
- ViewGroup和View的树形结构
- 一次完整的MotionEvent事件(ACTION_DOWN , ACTION_MOVE , ACTION_UP)

<!-- more -->

### 主要方法

1. boolean dispatchTouchEvent(MotionEvent ev)
   
   这个方法是分发点击事件的方法,只要这个点击事件能传递到当前的控件,就会调用这个方法

2. boolean onInterceptTouchEvent(MotionEvent ev)
   
   是否要拦截这个事件?要明白的是,View是没有这个方法的,因为View是最下层的,没有资格去拦截.
   
   它要么消费事件,要么不消费返回它的父控件,而不是自己拦截掉事件.

3. boolean onTouchEvent(MotionEvent event) 
   
   处理点击事件,ViewGroup的dispatchTouchEvent方法会调用这个方法.

### 主要参与成员

1. Activity
   
   我们要明白,一个事件在物理硬件层产生后,是由系统的输入系统处理,然后经过其传递通道(如果深入了解,我们可以知道,其底层是由一个双向的Socket来做到的),传递到UI线程,Activity是第一个拿到这个事件的,但是它并不能处理这个事件,所以Activity必须把这个事件分发下去,而不会自己处理.

2. ViewGroup
   
   它与View最大的不同在于,虽然它也是View的子类,但是它可能还管理着其他ViewGroup & View,所以它是有所有的三个方法的.

3. View
   
   既是所有控件的父类,也是我们说的最基本的控件,它只能选择处理或不处理事件,没有其他操作了.

## 阅读源码

### Activity#dispatchTouchEvent

```java
public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev.getAction() == MotionEvent.ACTION_DOWN) {
            onUserInteraction();   //空方法,不看
        }
        //查看superDispatchTouchEvent发现是一个抽象方法,那么我们去找它的实现类
        if (getWindow().superDispatchTouchEvent(ev)) {
            return true;
        }
        //直接调用了onTouchEvent()
        return onTouchEvent(ev);
}
```

=> Window 的实现类,现在只有一个 PhoneWindow

```java
 @Override
 public boolean superDispatchTouchEvent(MotionEvent event) {
        return mDecor.superDispatchTouchEvent(event);
     //那么我们知道mDecor是DecorView,它继承了FrameLayout并且是TitleView 和 ContextView的容器
 }


//DecorView的superDispatchTouchEvent方法
public boolean superDispatchTouchEvent(MotionEvent event) {
        return super.dispatchTouchEvent(event);
    }
```

很明显的,我们知道这个super是指的DecorView的父类ViewGroup

`android.view.ViewGroup#dispatchTouchEvent`

### ViewGroup#dispatchTouchEvent

这个代码长到爆炸

```java
@Override
public boolean dispatchTouchEvent(MotionEvent ev) { 
    //...省略
    //搜了半天才知道,mInputEventConsistencyVerifier调试用的,连带辅助功能的都省略了
    boolean handled = false;
    //onFilterTouchEventForSecurity 这个方法是View中的,如果false就要丢弃事件
    //第一步 : 
    //如果是ture才继续来处理这个事件,其实就是Window是否被遮盖的值
    if (onFilterTouchEventForSecurity(ev)) {
        final int action = ev.getAction();
        final int actionMasked = action & MotionEvent.ACTION_MASK;

        // Handle an initial down.
        if (actionMasked == MotionEvent.ACTION_DOWN) {
            //第二步 : 
            //这里清除掉了所有之前的状态,
            //1. clearTouchTargets() 看起来是清空了一个保存需要接受事件View的链表
            //   mFirstTouchTarget链表初始化
            //2.mGroupFlags &= ~FLAG_DISALLOW_INTERCEPT;
            //  这个标记意为:不允许ViewGroup对触摸事件进行拦截
            cancelAndClearTouchTargets(ev);
            resetTouchState();
        }

        final boolean intercepted;
        //第三步:
        //检查当前ViewGroup是否想要拦截触摸事件,并把值写入intercepted返回
        if (actionMasked == MotionEvent.ACTION_DOWN || mFirstTouchTarget != null) {
                   //这个标志位通过requestDisallowInterceptTouchEvent来设置
                final boolean disallowIntercept = (mGroupFlags & FLAG_DISALLOW_INTERCEPT) != 0;
                if (!disallowIntercept) {
                    //如果不禁用拦截事件,则调用onInterceptTouchEvent(ev);
                    //并且返回onInterceptTouchEvent的返回值给intercepted
                    intercepted = onInterceptTouchEvent(ev);
                    ev.setAction(action); // restore action in case it was changed
                } else {
                    intercepted = false;
                }
        } else {
                // There are no touch targets and this action is not an initial down
                // so this view group continues to intercept touches.
                intercepted = true;
        }
        //...省略

        //第四步,检查是否取消了事件
        final boolean canceled = resetCancelNextUpFlag(this)
            || actionMasked == MotionEvent.ACTION_CANCEL;

        // 第五步,把事件canceled,intercepted  既没有被取消,也没有被拦截的时候
        // 把事件分发到它的子View中去
        final boolean split = (mGroupFlags & FLAG_SPLIT_MOTION_EVENTS) != 0;
        TouchTarget newTouchTarget = null;
        boolean alreadyDispatchedToNewTouchTarget = false;
        if (!canceled && !intercepted) {
            //省略..
            if (actionMasked == MotionEvent.ACTION_DOWN
                || (split && actionMasked == MotionEvent.ACTION_POINTER_DOWN)
                || actionMasked == MotionEvent.ACTION_HOVER_MOVE) {
                final int actionIndex = ev.getActionIndex(); // always 0 for down
                final int idBitsToAssign = split ? 1 << ev.getPointerId(actionIndex)
                    : TouchTarget.ALL_POINTER_IDS;

                //清空这个idBitsToAssign之前的TouchTarget链表
                removePointersFromTouchTargets(idBitsToAssign);
               //获取这个View的所有子View个数
                final int childrenCount = mChildrenCount;
                if (newTouchTarget == null && childrenCount != 0) {
                    final float x = ev.getX(actionIndex);
                    final float y = ev.getY(actionIndex);
                    // Find a child that can receive the event.
                    // Scan children from front to back.
                    final ArrayList<View> preorderedList = buildTouchDispatchChildList();
                    final boolean customOrder = preorderedList == null
                        && isChildrenDrawingOrderEnabled();
                    final View[] children = mChildren;

                    //第六步,执行事件分发
                    //我们可以看到这里是遍历所有的子View,并把
                    for (int i = childrenCount - 1; i >= 0; i--) {
                        final int childIndex = getAndVerifyPreorderedIndex(
                           childrenCount, i, customOrder);
                        final View child = getAndVerifyPreorderedView(
                            preorderedList, children, childIndex);
                        //省略...

                        //这里判断,当前循环到的这个子View是否可点击,并且这个坐标
                        //在子View的可视范围内,如果都满足,则跳出判断继续执行下面的代码,如果
                        //不能满足条件,则continue,跳过这个View
                        if (!canViewReceivePointerEvents(child)
                          || !isTransformedTouchPointInView(x, y, child, null)) {
                            ev.setTargetAccessibilityFocus(false);
                            continue;
                        }

                        newTouchTarget = getTouchTarget(child);
                        if (newTouchTarget != null) {
                            // Child is already receiving touch within its bounds.
                            // Give it the new pointer in addition to the ones it is handling.
                            newTouchTarget.pointerIdBits |= idBitsToAssign;
                            break;
                        }

                        resetCancelNextUpFlag(child);
                        //我们可以看到,这里把事件分发下去了,给了当前的这个child
                        if (dispatchTransformedTouchEvent(ev, false, child, idBitsToAssign)) {
                            // Child wants to receive touch within its bounds.
                            //如果能走到这里,则子View返回的肯定是ture,说明子View
                            //消费 & 拦截了这个事件
                            mLastTouchDownTime = ev.getDownTime();
                            if (preorderedList != null) {
                                // childIndex points into presorted list, find original index
                                for (int j = 0; j < childrenCount; j++) {
                                    if (children[childIndex] == mChildren[j]) {
                                        mLastTouchDownIndex = j;
                                        break;
                                    }
                                }
                            } else {
                                mLastTouchDownIndex = childIndex;
                            }
                            mLastTouchDownX = ev.getX();
                            mLastTouchDownY = ev.getY();
                            //ddTouchTarget()将child添加到mFirstTouchTarget
                            newTouchTarget = addTouchTarget(child, idBitsToAssign);
                            //设置alreadyDispatchedToNewTouchTarget为true
                            alreadyDispatchedToNewTouchTarget = true;
                            break;
                        }

                        // The accessibility focus didn't handle the event, so clear
                        // the flag and do a normal dispatch to all children.
                        ev.setTargetAccessibilityFocus(false);
                    }
                    if (preorderedList != null) preorderedList.clear();
                }

                if (newTouchTarget == null && mFirstTouchTarget != null) {
                    // Did not find a child to receive the event.
                    // Assign the pointer to the least recently added target.
                    newTouchTarget = mFirstTouchTarget;
                    while (newTouchTarget.next != null) {
                        newTouchTarget = newTouchTarget.next;
                    }
                    newTouchTarget.pointerIdBits |= idBitsToAssign;
                }
            }
        }
        //以上,判断不被取消,不被拦截的方法完毕了


        //第七步,继续分发事件
        // Dispatch to touch targets.
        //这里注意看dispatchTransformedTouchEvent的第三个参数,是null
        //在该方法中,child这个参数为null,则是直接调用了super.dispatchTouchEvent(ev)
        if (mFirstTouchTarget == null) {
            // No touch targets so treat this as an ordinary view.
            handled = dispatchTransformedTouchEvent(ev, canceled, null,
                                                    TouchTarget.ALL_POINTER_IDS);
        } else {
            // Dispatch to touch targets, excluding the new touch target if we already
            // dispatched to it.  Cancel touch targets if necessary.
            TouchTarget predecessor = null;
            TouchTarget target = mFirstTouchTarget;
            while (target != null) {
                //TouchTarget   这里是一直在遍历这个链表,进行判断,事件分发
                final TouchTarget next = target.next;
                if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) {
                    handled = true;
                } else {
                    final boolean cancelChild = resetCancelNextUpFlag(target.child)
                        || intercepted;
                    if (dispatchTransformedTouchEvent(ev, cancelChild,
                                                      target.child, target.pointerIdBits)) {
                        handled = true;
                    }
                    if (cancelChild) {
                        if (predecessor == null) {
                            mFirstTouchTarget = next;
                        } else {
                            predecessor.next = next;
                        }
                        target.recycle();
                        target = next;
                        continue;
                    }
                }
                predecessor = target;
                target = next;
            }
        }

        //第八步 如果有必要,更新取消标记
        // Update list of touch targets for pointer up or cancel, if needed.
        if (canceled
            || actionMasked == MotionEvent.ACTION_UP
            || actionMasked == MotionEvent.ACTION_HOVER_MOVE) {
            resetTouchState();
        } else if (split && actionMasked == MotionEvent.ACTION_POINTER_UP) {
            final int actionIndex = ev.getActionIndex();
            final int idBitsToRemove = 1 << ev.getPointerId(actionIndex);
            removePointersFromTouchTargets(idBitsToRemove);
        }
    }

    if (!handled && mInputEventConsistencyVerifier != null) {
        mInputEventConsistencyVerifier.onUnhandledEvent(ev, 1);
    }
    return handled;
}
```

我们不妨来梳理一下

第一步至第三步都是根据各种标记,是否可见等来判断是否需要分发这个事件.

从第四步开始,才是开始分发这个事件的代码,第五步判断是不是DOWN,MOVE事件,如果是就开始分发给每一个子View,同时把这个View添加到了`mFirstTouchTarget`这个链表中

而我们可以看到第七步,`mFirstTouchTarget == null`判断这个链表,如果不是null就继续分发事件,如果是null的话就直接回调父类的`super.dispatchTouchEvent`

这样我们可以得出一个结论:

> 如果一个View没有接收到`DOWN`事件,而后的事件它肯定也无法接收到.

### android.view.ViewGroup#dispatchTransformedTouchEvent

```java
 private boolean dispatchTransformedTouchEvent(MotionEvent event, boolean cancel,
            View child, int desiredPointerIdBits) {
        final boolean handled;

        //省略...

        // Perform any necessary transformations and dispatch.
        if (child == null) {
            //如果子View为空,则把自己当做一个View来处理,这里是直接调用的View.dispatchTouchEvent
            handled = super.dispatchTouchEvent(transformedEvent);
        } else {
            final float offsetX = mScrollX - child.mLeft;
            final float offsetY = mScrollY - child.mTop;
            transformedEvent.offsetLocation(offsetX, offsetY);
            if (! child.hasIdentityMatrix()) {
                transformedEvent.transform(child.getInverseMatrix());
            }
            //这里就很明白了,事件又传递到该ViewGroup的子View中去了
            handled = child.dispatchTouchEvent(transformedEvent);
        }

        // Done.
        transformedEvent.recycle();
        //返回
        return handled;
    }
```

### android.view.ViewGroup#onInterceptTouchEvent

```java
   public boolean onInterceptTouchEvent(MotionEvent ev) {
        if (ev.isFromSource(InputDevice.SOURCE_MOUSE)
                && ev.getAction() == MotionEvent.ACTION_DOWN
                && ev.isButtonPressed(MotionEvent.BUTTON_PRIMARY)
                && isOnScrollbarThumb(ev.getX(), ev.getY())) {
            return true;
        }
        return false;
    }
```

注意看一下他的注释

`Implement this method to intercept all touch screen motion events.`

一般都是返回false的,如果你需要拦截所有的事件而不去分发,重写然后返回ture即可

### onTouchEvent

而ViewGroup的onTouchEvent是直接走的View.onTouchEvent()

## 总结

- **ViewGroup中dispatchTouchEvent()会把事件进行遍历传递**
  
  遍历它自己的所有子View,然后调用child的dispatchTouchEvent()来分发触摸事件

- **ViewGroup的某个子View没有接受ACTION_DOWN,则它再也不会被分发事件了**

- **ViewGroup的onInterceptTouchEvent()默认返回false**
  
  也就是说,如果你需要自定义的ViewGroup拦截事件,直接重写返回false即可

- **ViewGroup的onTouchEvent 并没有自己的实现,直接调用其父类View的**
