// compile.js编译
class Compile {
	constructor(el, vm) {
		this.el = this.isElementNode(el) ? el : document.querySelector(el);
		this.vm = vm;
		if(this.el) {
			// 如果这个元素能获取到 我们才开始编译
			// 1、先把真实DOM移入真实内存中 fragment
			let fragment = this.node2fragment(this.el);

			// 2、编译 => 提取想要的元素节点 v-model 和 文本节点 {{}}
			this.compile(fragment);



			// 3、把编译好的fragment再塞回页面中
			this.el.appendChild(fragment);
		}
	}
	/* 辅助的方法 */
	isElementNode(node) {
		return node.nodeType === 1;
	}
	// 是不是指令
	isDirective(name) {
		return name.includes('v-');
	}


	/* 核心的方法 */	
	compileElement(node) {
		// 带v-model
		let attrs = node.attributes;
		// console.log(attrs);
		Array.from(attrs).forEach(attr => {
			// console.log(attr.name)
			// 判断是否包含v-
			let attrName = attr.name;
			if(this.isDirective(attrName)){
				// 取道对应的值放到节点中
				let expr = attr.value;
				// node this.vm.$data expr
				// todo ......
				// console.log(attrName)
				let newAttrName = attrName.replace('v-', '')
				// console.log(newAttrName)
				let [,type] = attrName.split('-');
				// console.log(type);
				// split('-')
				// slice(2);
				// splice
				// substring
				// replace
				CompileUtil[newAttrName](node, this.vm, expr);
			}
		})
	}
	compileText(node) {
		// 带{{}}
		let expr = node.textContent; // 取文本中的内容
		// console.log(text)
		let reg = /\{\{([^}]+)\}\}/g;
		if(reg.test(expr)){
			// node this.vm.$data text
			// todo .....
			CompileUtil['text'](node, this.vm, expr)
		}
	}
	compile(fragment) {
		let childNodes = fragment.childNodes;
		// console.log(childNodes)
		Array.from(childNodes).forEach(node => {
			if(this.isElementNode(node)){
				// 是元素节点,递归
				// 编译元素
				// console.log('element', node);
				this.compileElement(node);
				this.compile(node)
			}else{
				// 是文本节点
				// 编译文本
				// console.log('text', node);
				this.compileText(node)
			}
		});
	}
	node2fragment(el) {
		// 文档碎片
		let fragment = document.createDocumentFragment();
		let firstChild;
		while(firstChild = el.firstChild) {
			fragment.appendChild(firstChild)
		}
		return fragment; // 内存中的节点

	}
}

CompileUtil = {
	getVal(vm, expr) { // 获取实例上对应的数据
		expr = expr.split('.'); // [a,b,c,d,e,f]
		return expr.reduce((prev, next) => { // vm.$data.a
			return prev[next];
		}, vm.$data)
	},
	getTextVal(vm, expr) { // 获取编译文本后的结果
		return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
			return this.getVal(vm, arguments[1]);
		});
	},
	text(node, vm, expr) { // 文本处理
		let updateFn = this.updater['textUpdater'];
		let value = this.getTextVal(vm, expr)
		expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
			new Watcher(vm, arguments[1], () => {
				// 如果数据变化了，文本节点需要重新获取依赖的属性更新文本中的内容
				updateFn && updateFn(node, this.getTextVal(vm, expr));
			});
		});
		updateFn && updateFn(node, value)
	},
	setVal(vm, expr, value) { // [message, a]
		expr = expr.split('.');
		// 收敛
		return expr.reduce((prev, next, currentIndex) => {
			if(currentIndex === expr.length - 1) {
				return prev[next] = value;
			}
			return prev[next]
		}, vm.$data);
	},
	model(node, vm, expr) { // 输入框处理
		let updateFn = this.updater['modelUpdater'];
		// 添加监控，数据变化后，调用watch的callback
		new Watcher(vm, expr, () => {
			// 当值变化后，会调用cb，将新值传递过来
			updateFn && updateFn(node, this.getVal(vm, expr));
		});
		node.addEventListener('input', (e) => {
			let newValue = e.target.value;
			this.setVal(vm, expr, newValue);
		})
		updateFn && updateFn(node, this.getVal(vm, expr));
	},
	updater: {
		// 文本更新
		textUpdater(node, value) {
			node.textContent = value;
		},
		// 输入框更新
		modelUpdater(node, value) {
			node.value = value;
		}
	}
}
