
// function lazy_sum(arr) {
//     // 内部定义一个函数 sum
//     let sum = function () {
//         return arr.reduce(function (x, y) {
//             return x + y;
//         });
//     }
//     return sum; // 返回【函数本身】，不是执行结果！
// }

// let f = lazy_sum([1, 2, 3, 4, 5]); 
// f();

//第一个函数
// function doSomething() {
//   return new Promise(function (resolve, reject) {
//     console.log("第一步：开始获取数字");

//     setTimeout(function () {
//       const result = 10;

//       console.log("第一步完成，得到：", result);
//       resolve(result);
//     }, 1000);
//   });

// }


// function doSomethingElse(result) {
//   return new Promise(function (resolve, reject) {
//     console.log("第二步：把数字乘以 2");

//     setTimeout(function () {
//       const newResult = result * 2;

//       console.log("第二步完成，得到：", newResult);
//       resolve(newResult);
//     }, 1000);
//   });
// }

// function doThirdThing(newResult) {
//   return new Promise(function (resolve, reject) {
//     console.log("第三步：给数字加上 5");

//     setTimeout(function () {
//       const finalResult = newResult + 5;

//       console.log("第三步完成，得到：", finalResult);
//       resolve(finalResult);
//     }, 1000);
//   });
// }


// function failureCallback(error) {
//   console.error("执行失败：", error);
// }

// doSomething()
//   .then(function (result) {
//     return doSomethingElse(result);
//   })
//   .then(function (newResult) {
//     return doThirdThing(newResult);
//   })
//   .then(function (finalResult) {
//     console.log(`得到最终结果：${finalResult}`);
//   })
//   .catch(failureCallback);
  

// const promise = new Promise(function (resolve,reject){
//   const success = true;
//   console.log('开始执行异步操作');
//   setTimeout(function(){
//     console.log('异步操作ing');
//     if(success){
//       console.log('异步尾声了');
//       resolve('成功');
//     } else {
//       reject(new Error('失败'));
//     }
//   },500);
//   console.log('异步操作执行完毕');
// });

// promise
//   .then(function(result){
//     console.log('成功的回调');
//     console.log(result);
//   })
//   .catch(function(error){
//     console.log('失败的回调');
//     console.error(error);
//   });

const func = (x) => x * x; //隐含返回值
const func2 = (x,y) => { return x + y }; //显式返回值


async function doAsyncOperation() {
  const success = true; // 设置为 false 来模拟失败的情况

  console.log('开始执行异步操作');

  const result = await new Promise(function (resolve, reject) {
    console.log('~~',new Date().toLocaleTimeString());
    setTimeout(function () {
      console.log('异步操作ing');

      if (success) {
        console.log('异步尾声了');
        console.log('异步尾声时间', new Date().toLocaleTimeString());
        resolve('成功');
      } else {
        reject(new Error('失败'));
      }
    }, 1200);
    console.log('time',new Date().toLocaleTimeString());
    console.log('异步操作执行完毕', new Date().toLocaleTimeString());
    
  });

  return result;
}

async function main() {
  console.log('开始执行 main 函数');
  try {
    console.log('开始计算...');
    const result = await doAsyncOperation();
    console.log('最终结果时间', new Date().toLocaleTimeString());
    console.log('成功的回调');
    console.log(result);
  } catch (error) {
    console.log('失败的回调');
    console.error(error);
  }
}

main();