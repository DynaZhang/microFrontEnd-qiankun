# qiankun微前端框架demo

## 目录
1. container为容器
2. vue-app1和vue-app2为vue单页应用
3. vue-admin1集成vue-element-admin框架
4. vue-admin2集成iview-admin框架

## todo:
1. 改造vue-element-admin登录机制，目前不能使用container提供的cookies
2. 解决部分应用首次加载慢的问题
3. 路由动态加载

## qiankun接入vue项目步骤
### 主应用
1. npm/yarn安装qiankun
```
  npm install qiankun
  yarn add qiankun
```
2. 配置子应用列表(具体配置可查看qiankun文档)
```
function genActiveRule(routerPrefix) {
  return location => location.pathname.startsWith(routerPrefix);
}
export default [
  {
    name: 'vue-app1',
    entry: '//localhost:8081',
    container: '#subApp-container',
    activeRule: genActiveRule('/vue-app1')
  },
  {
    name: 'vue-app2',
    entry: '//localhost:8082',
    container: '#subApp-container',
    activeRule: genActiveRule('/vue-app2')
  },
  {
    name: 'vue-admin1',
    entry: '//localhost:8083',
    container: '#subApp-container',
    activeRule: genActiveRule('/vue-admin1')
  },
  {
    name: 'vue-admin2',
    entry: '//localhost:8084',
    container: '#subApp-container',
    activeRule: genActiveRule('/vue-admin2')
  }
]
```

3. 调整主应用入口文件main.js
```
import Vue from "vue";
import App from "./App.vue";

import appList from "./config/appList";    // 引入子应用列表
import { registerMicroApps, start } from "qiankun";

import router from "./router";
import store from "./store";

import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import "normalize.css/normalize.css";

import Cookies from 'js-cookies'
Cookies.setItem('token', 'super_admin')

Vue.config.productionTip = false
Vue.use(ElementUI)

new Vue({
  render: h => h(App),
  router,
  store,
}).$mount('#app')

// 注册子应用
registerMicroApps(appList, {
  beforeLoad: app => {
    console.log('before load app.name====>>>>>', app.name)
  },
  beforeMount: [
    app => {
      console.log('[LifeCycle] before mount %c%s', 'color: green;', app.name)
    }
  ],
  afterMount: [
    app => {
      console.log('[LifeCycle] after mount %c%s', 'color: green;', app.name)
    }
  ],
  afterUnmount: [
    app => {
      console.log('[LifeCycle] after unmount %c%s', 'color: green;', app.name)
    }
  ]
})

start()  // 开始运行
```

3. 改造根组件App.vue
```
<template>
  <div id="app">
    <el-menu :default-active="currentApp" :router="true" mode="horizontal" @select="handleSelectMenu">
      <!--基座中可以放自己的路由-->
      <el-menu-item index="/home">Home</el-menu-item>

      <!--引用其他子应用-->
      <el-menu-item index="/vue-app1">vue应用1</el-menu-item>
      <el-menu-item index="/vue-app2">vue应用2</el-menu-item>
      <el-menu-item index="/vue-admin1">vue-element-admin</el-menu-item>
      <el-menu-item index="/vue-admin2">iview-admin</el-menu-item>
    </el-menu>

    <router-view></router-view>

    <!-- 下面的容器用于挂载子应用 不能删除 -->
    <div id="subApp-container"></div>
  </div>
</template>

<script>

  import {getCurrentApp, saveCurrentApp} from "./libs/storage";

export default {
  name: 'app',
  data () {
    return {
      currentApp: ''
    }
  },
  methods: {
    handleSelectMenu(index) {
      saveCurrentApp(index)
    }
  },
  mounted() {
    this.currentApp = getCurrentApp() ? getCurrentApp() : '/'
  }
}
</script>

<style>
  html,body {
    width: 100%;
    height: 100%;
  }
  #app {
    height: 100%;
    width: 100%;
  }
  #subApp-container {
    height: calc(100% - 61px);
    overflow: hidden;
  }
  #subApp-container div[data-name] {
    width: 100%;
    height: 100%;
  }
</style>
```

### 子应用
1. 改造入口文件main.js
```
import Vue from "vue";
import App from "./App";
import router from "./router";

Vue.config.productionTip = false

let instance = null;
function render(props = {}) {
  const { container } = props;
  instance = new Vue({
    router,
    render: h => h(App),
  }).$mount(container ? container.querySelector('#app') : '#app');
}
// 解决子项目不能独立访问的问题 根据访问来源，执行不同渲染方法
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}
// 解决基础路径不正确的问题
if (window.__POWERED_BY_QIANKUN__) {
  // 动态添加publicPath
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
// 启动
export async function bootstrap() {
  console.log('[vue] vue app bootstraped');
}
// 挂载
export async function mount(props) {
  console.log('[vue] props from main framework', props);
  render(props);
}
// 卸载
export async function unmount() {
  instance.$destroy();
  instance.$el.innerHTML = '';
  instance = null;
}
```

2. 改造vue.config.js
```
const path = require('path');
const { name } = require('./package.json');   // name表示app名称

module.exports = {
  publicPath: '//localhost:8081',   // 防止js访问错误
  outputDir: 'dist',
  assetsDir: 'static',
  filenameHashing: true,
  devServer: {
    hot: true,
    disableHostCheck: true,
    port: 8081,
    overlay: {
      warnings: false,
      errors: true
    },
    headers: {
      'Access-Control-Allow-Origin': '*'    // 容器应用访问子应用存在跨域情况，需要配置请求头
    }
  },
  configureWebpack: {
    output: {    // 将输出格式定为umd格式
      library: `${name}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${name}`
    }
  }
}
```

3. 改造vue-router实例化的配置
```
const router = new VueRouter({
  mode: 'history',
  base: window.__POWERED_BY_QIANKUN__ ? '/{app名称}' : '/',   // 判断是不是在qiankun环境下运行
  routes: []
})
```
