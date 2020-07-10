//新建虚拟DOM
//我们最后要生成的结果也就是我们的虚拟DOM
// {
//     tag:'div',
//     data:{id:app},
//     children:[{tag:'p',data:{class:'item'},children:['节点1']}]
// }
//定义下标记 比如元素的类型
const vnodeType ={ 
    HTML:'HTML', //如果是元素 我就把你标记为HTML
    TEXT:'TEXT', //如果是文本 我就把你标记为TEXT
    COMPONENT:'COMPONENT', //如果是组件 我就把你标记为COMPONENT
    CLASS_COMPONENT:'CLASS_COMPONENT' //如果是函数类型的组件 就标记为 CLASS_COMPONENT 
}
//定义一下 你传进来的子元素 都是什么类型 比如一个 没有 多个
const childrenType = {
    EMPTY:'EMPTY', //空的  你没有传子元素
    SINGLE:'SINGLE', //只有一个子元素
    MULTIPLE: 'MULTIPLE' //多个子元素
}
function createElement(tag,data,children = null){
    let flag 
    //如果你给我传进来的是个字符串 那么我把你标记为HTML元素
    if(typeof tag === 'string'){
        //我就把你标记为元素
        flag = vnodeType.HTML
    }else if(typeof tag === 'function'){
        //如果你传进来的是个 函数 我就认为你是组件
        flag = vnodeType.COMPONENT
    }else{
        //如果什么都没有 我就认为你是一个文本
        flag = vnodeType.TEXT
    }
    //标记子元素 分几种情况  第一种 没有子元素 第二种 有单个子元素 第三个 有多个子元素
    let childrenFlag
    //然后去标记我们的子元素 是哪种情况
    if(children == null){
        //如果你没传子元素 我就认为 你的children是空的
        childrenFlag = childrenType.EMPTY
    }else if(Array.isArray(children)){
        //如果我你是个数组 我就看你的长度 有可能 你给我传个空数组过来 这时候我们也要标记是空的
        let length = children.length
        if(length === 0){
            childrenFlag = childrenType.EMPTY
        } else {
            childrenFlag = childrenType.MULTIPLE
        }
    }else {
        //如果你不是null 我就认为 你这里就是传进来了一个文本 
        childrenFlag = childrenType.SINGLE
        //然后创建文本的vnode
        children = createTextVnode(children + '')

    }
    //返回Vnode
    return {
        el:null, //用来存储我们的真实DOM
        flag, // 这个们用来标记 你是元素 还是 文本 还是 组件函数 之类的类型
        tag,  //标签 就是 div 和html5标签 如果是文本就没有tag 还由组件之类的
        data, // 属性
        children, // 子元素
        childrenFlag, //标记子元素
        key:data && data.key
    }
}

//创建文本类型的Vnode
function createTextVnode (text){
    return {
        flag:vnodeType.TEXT,
        tag:null,
        data:null,
        children:text,
        childrenFlag: childrenType.EMPTY,
        el:null
    }
}

//渲染函数
function render (vnode,container) {
    if(container.vnode){
        //如果你的vnode存在你的DOM里就说明 你首次挂载过
        //参数是 老的vnode 新的vnode 你的容器
        patch(container.vnode,vnode,container)
    }else{
        //如果没有 我们就说明你是首次渲染
        mount(vnode,container)
    }
    container.vnode = vnode
}
//更新 patch
function patch (prev,next,container){
    //参数是 老的vnode 新的vnode 和同期
    //把我们新老的标记 解构出来
    let nextFlag = next.flag
    let prevFlag = prev.flag
    //如果你新的vnode和老的vnode 标记的类型不一样 就说明没什么而更新操作 
    //比如 你老的是标签 你新的是文本 就直接干掉 然后重新渲染即可
    if(nextFlag !== prevFlag){
        replaceVnode(prev,next,container)
    }else if(nextFlag == vnodeType.HTML){
        //如果你新节点传进来是个标签 我们就做下面的操作
        patchElement(prev,next,container)
    }else if(nextFlag == vnodeType.TEXT){
        //如果你新的虚拟DOM 是个文本
        patchText(prev,next,container)
    }
}
//如果你新的vnode和老的vnode 标记的类型不一样 就说明没什么而更新操作 
//比如 你老的是标签 你新的是文本 就直接干掉 然后重新渲染即可
function replaceVnode (prev,next,container){
    //就直接删除 然后在挂载新的 这里的prev.el 是我们最开始存放的就是根的真实的DOM
    container.removeChild(prev.el)
    //然后在挂载新的
    mount(next,container)
}
//如果你新的传进来的也是个标签
function patchElement(prev,next,container) {
    //我们就看看 你新的vnode 和老的vnode 标签是不是一样的 如果不是一样的就直接干点
    if(prev.tag !== next.tag){
        //不是一样的标签 就直接干调才重新挂载
        replaceVnode(next,container)
        return
    }
    //如果不是那种情况我们就开始处理一下属性
    let el = (next.el = prev.el) //更新一下el
    let prevData = prev.data //把老的vnode属性解构出来
    let nextData = next.data //把新的vnode属性解构出来
    if(nextData){
        //如果新的vnode 有属性 我们就开始遍历更新
        for(let key in nextData){
            //这里就是获取到如果你的新的vnode里也有这个key 老的vnode也有这个key之不是value不一样所以我们要获取出来
            //新{key:a} //老{key:b}都存在相同的key 只不过值不一样 我们要取出来做对比
            let prevVal = prevData[key]
            let nextVal = nextData[key]
            //开始更新 根节点 然后key 老的属性值 新的属性值
            patchData(el,key,prevVal,nextVal)
        }
    }
    if(prevData){
        //如果老的vnode存在 
        for(let key in prevData){
            //把值搞出来
            let prevVal = prevData[key]
            if(prevVal && !nextData.hasOwnProperty(key)){
                //如果你老的vnode属性值存在 并且 在新的vnode没有这个属性 那么我们就该做删除操作 
                patchData(el,key,prevVal,null)
            }
        }
    }
    //上面的属性更新完毕了 
    //下面开始更新子元素
    //需要传进去的参数 老vnode的子元素的节点类型 和 子元素 新vnode的子元素类型和子元素 还有真实dom
    patchChildren(prev.childrenFlag,next.childrenFlag,prev.children,next.children,el)
}
//开始更新子元素节点
function patchChildren(prevChilFlag,nextChildFlag,prevChildren,nextChildren,container){
    //这里面会针对新老几种状况取做对比 和操作
    // 1.老的vnode的子元素 是单独的 比如就是一个文本
    // 2.老的vnode的子元素 是空的 没有
    // 3.老的vnode子元素 是多个的 
    //然后上面的每一个种情况都要对比下面新的哪三种情况
    // 1.新的vnode子元素是单独的
    // 2.新的vnode子元素是空的
    // 3.新的vnode子元素是多个
    switch(prevChilFlag){
        //老的虚拟DOM 是单个的 然后分别取对比新的vnode那三种情况
        case childrenType.SINGLE:
            //这里我们嵌套了一层switch  对应 新的vnode 三种情况
            switch(nextChildFlag){
                // 老的vnode是单独的 对应新的vnode 是拿单独的
                case childrenType.SINGLE:
                    //老的vnode子元素值文本 新的也是 就直接把老的文本删除 然后从新mount挂载新的
                    patch(prevChildren,nextChildren,container)
                 break
                case childrenType.EMPTY:
                    //如果是老的vnode是单独的 新的是空的 就直接移除
                    container.removeChild(prevChildren.el)
                 break
                case childrenType.MULTIPLE:
                    //如果老的vnode 是单个 新的 是多个 先把老的干掉在 把新的循环挂载
                    container.removeChild(prevChildren.el)
                    for(let i = 0; i < nextChildren.length; i++){
                        mount(nextChildren[i],container)
                    }
                 break
            }
         break
        //老的虚拟DOM 是空的 然后分别取对比新的vnode那三种情况
        case childrenType.EMPTY:
            switch(nextChildFlag){
                case childrenType.SINGLE:
                    //如果老的vnode是空的 新的是单个 我们直接挂载就好
                    mount(nextChildren,container)
                 break
                case childrenType.EMPTY:
                    //如果老的vnode是空的 新的也是 那就啥也不干
                 break
                case childrenType.MULTIPLE:
                    //如果新的vnode是空的 老的是多个 就循环的取挂载新的
                    for(let i = 0 ; i< nextChildren.length;i++){
                        mount(nextChildren[i],container)
                    }
                 break
            }
         break
        //老的虚拟DOM 是多个的 然后分别取对比新的vnode那三种情况
        case childrenType.MULTIPLE:
            switch(nextChildFlag){
                case childrenType.SINGLE:
                    //如果老的是多个 新的是单个 那就循环的去把老的vnode删掉 把新的挂载
                    for(let i=0;i<prevChildren.length;i++){
                        container.removeChild(prevChildren[i].el)
                    }
                    mount(nextChildren,container)
                 break
                case childrenType.EMPTY:
                    //如果新的vnode是多个 老的是空的 我们直接把老的删除掉即可
                    for(let i=0;i<prevChildren.length;i++){
                        container.removeChild(prevChildren[i].el)
                    }
                 break
                case childrenType.MULTIPLE:
                    //如果老的vnode是多个 新的也就 就要重新对比了 老的vnode是数组 新的也是数组
                    //这里就设计到一些情况了
                    //这里抽象举例 老的是[a,b,c] 新的是[a,1,b,2,c,3] 这种情况
                    //因为新的abc 索引是递增的  而老的也是递增的 所以我们不需要做修改 只是新增它中间对应的元素 因为相对位置是不变的
                    //这我们所计算的都是相对位置 那么相对位置变和不变 我怎么辨别的 这里只要新的索引大于老的索引 我们就认为它的相对位置没有改变
                    let lastIndex = 0
                    
                    for(let i= 0; i< nextChildren.length;i++){
                        //把新的vnode都拿出来
                        let nextVnode = nextChildren[i]
                        let j = 0;
                        let find = false
                        for(j;j<prevChildren.length;j++){
                            let preVnode = prevChildren[j]
                            if(preVnode.key === nextVnode.key){
                                //如果找到了
                                find = true
                                //key相同 是同一个元素
                                 patch(preVnode,nextVnode,container)
                                
                                 if(j<lastIndex){
                                    //需要移动节点 abc a移动到b之后 所以们要找到abc的父元素 insert一下
                                    let flagNode = nextChildren[i - 1].el.nextSibling
                                    container.insertBefore(preVnode.el,flagNode)
                                }else{
                                    lastIndex = j
                                }
                            }   
                        }
                        if(!find){ 
                                //如果老的vnode里没有找到这个节点 就说明是新增 
                                let flagNode = i == 0 ? prevChildren[0].el:nextChildren[i-1].el.nextSibling
                                mount(nextVnode,container,flagNode)
                             }
                    }
                    //移除不需要的元素 老的vnode里有 新的里面没有了 就要删除
                    for(let i = 0; i< prevChildren.length; i++){
                        const prevVnode = prevChildren[i]
                        const has = nextChildren.find(next => next.key == prevVnode.key)
                        if(!has){
                            container.removeChild(prevVnode.el)
                        }
                    }
                 break
            }
         break
    }

}
//如果新的vnode 是个节点 
function patchText(prev,next,container) {
    //这里已经可以确认 你新的vnode 就是个文本节点了
    let el = (next.el = prev.el)
    //所以我们这里在判断如果你们的子节点都不一样 那么我就可以直接 把你新的DOM的文本直接复制即可
    //这里为什么要做判断 因为有可能 你的新的节点是这样 你好<span>啦啦啦</span>是的我好
    if(next.children !== prev.children){
        //我们就直接让DOM的值等于你这个文本
        el.nodeValue = next.children
    }
}
//首次挂载 把我们的真实DOM挂载到容器上
function mount (vnode,container,flagNode){
    //先区分flag的类型 这样就知道 你每个节点到底是什么东西
    let {flag} = vnode
    if(flag === vnodeType.HTML) {
        //如果你是元素 我们就用元素的挂载方法
        mountElement(vnode,container,flagNode)
    }else if(flag === vnodeType.TEXT){
        //如果你是文本 我们就用文本的挂载方法
        mountText(vnode,container)
    }
}
//如果标记的是元素的挂载方法
function mountElement(vnode,container,flagNode){
    //创建你虚拟DOM 的标签元素
    let dom = document.createElement(vnode.tag)
    //存储真实DOM 为挂载用
    vnode.el = dom
    //把它上面的属性读解析出来
    // let data = vnode.data
    //把虚拟DOM 的属性解构出来
    let {data,children,childrenFlag} = vnode
    //开始处理节点的属性
    for(var key in data){
        //这里我们分辨把当前的dom 和 绑定的key 还有新的节点 和你的值传入进去 这里要做对比
        patchData(dom,key,null,data[key])
    }
    //开始挂载子元素
    //首先判断你的子元素是什么类型
    if(childrenFlag != childrenType.EMPTY){
        //需要判断一下你的子节点类型如果不是空的我才能挂载
        if(childrenFlag == childrenType.SINGLE){
            //如果你是文本节点 我们就直接使用mount方法去挂载 到我们的父元素上 这里就不是容器了
            mount(children,dom)
        }else if(childrenFlag == childrenType.MULTIPLE){
            //如果你的子元素是多个 也就是传进来是个数组 那我们就开始循环
            for(var i = 0; i < children.length;i++){
                //一次去挂载
                mount(children[i],dom)
            }
        }
    }
    //最后挂载我们的父元素
    //这里还可能存在我们新的vnode节点 要插入到老的vnode节点前面
    flagNode ? container.insertBefore(dom,flagNode):container.appendChild(dom)
}
//如果标记是文本挂载方法
function mountText (vnode,container){
    let dom = document.createTextNode(vnode.children)
    vnode.el = dom
    container.appendChild(dom)
}   
//处理节点上的属性
function patchData (el,key,prev,next) {    
    //这里就是用switch 一次去比对了
    // console.log(next)
    // console.log(next[key])
    switch(key){
        case 'style':
            for(let k in next){
                //因为你虚拟DOM传进来的 {style:{color:blue}} 处理之后 <div style="color:blue">
                el.style[k]= next[k]
            }
            //如果你新的值在老的里没有 那么我们就变成空
            for(let k in prev){
                if(!next.hasOwnProperty(k)){
                    el.style[k] = ''
                }
            }
            break; 
        case 'class':
            el.className = next 
        break;
         //如果默认的就是那些有事件的
        default:
            //我们的key循环出来可能是这样的@click字符串 取它的0位 就是@
            if(key[0] === '@'){
                if(prev){
                    //移除老的事件
                    el.removeEventListener(key.slice(1),prev)
                }
                if(next){
                    el.addEventListener(key.slice(1),next)
                }
               
            }else {
                //如果不是你自己定义的 我们就添加自定义属性 
                el.setAttribute(key,next)
            }
        break
    }
}