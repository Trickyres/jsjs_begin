/*
  JavaScript 负责“什么时候改变 class”。
*/

// 记录当前页面
const state = {
  view: "home"
};

// querySelectorAll 的简写 这是写了一个关于查找的小函数工具，方便后续调用
function $$(selector) {
  return document.querySelectorAll(selector);
}

// 页面切换核心函数
function setView(view) {
  console.clear();
  console.log("① setView 收到目标页面：", view);

  // 第一步：更新状态
  state.view = view;
  document.querySelector("#currentView").textContent = state.view;

  console.log("② state.view 已变为：", state.view);

  // 第二步：控制页面显示和隐藏
  $$(".view").forEach(function (page) {
    const pageName = page.dataset.view;
    const isTargetPage = pageName === view;

    console.log(
      `③ 检查页面 ${pageName}：`,
      isTargetPage ? "添加 active" : "移除 active"
    );

    if (isTargetPage) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });

  // 第三步：更新导航按钮的选中状态
  $$(".nav-item").forEach(function (button) {
    const buttonTarget = button.dataset.go;
    const isCurrentButton = buttonTarget === view;

    console.log(
      `④ 检查按钮 ${buttonTarget}：`,
      isCurrentButton ? "添加 active" : "移除 active"
    );

    if (isCurrentButton) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  console.log("⑤ 页面切换完成");
}

// 给每个导航按钮绑定点击事件 dataset.go 是js的索引语法
$$(".nav-item").forEach(function (button) {
  button.addEventListener("click", function () {
    const targetView = button.dataset.go;

    console.log("用户点击按钮，目标页面：", targetView);

    setView(targetView);
  });
});
