'use strict'; //严格模式，禁止使用未声明的变量
console.log("Hello, World!");
//最简单的js对象是一个字典的形式
var person = {
    name:'Bob',
    age:20,
    tags:['js','nodejs','web'],
    city:'shanghai',
    hasCar:true
};
console.log(person.name);
console.log(person.tags[1]); //对象变量.属性名的方式获取
//变量名是大小写英文数字，不能数字开头
//console.log是最简单的查看值的方式
//没有用var 申明的变量为全局变量，容易引起冲突，应该避免使用
console.log(`这是一个
多行
字符串`);//反引号`...`表示

let name = '小明' ;
let age = 20;
let message =  `你好, ${name}, 你今年${age}岁了!`;//字符串模板
console.log(message);   

let s = "hello, world!"; //字符串是不可变的。
s.length; //字符串的长度
s.toUpperCase(); //字符串转换为大写 是一个函数方法
s.indexOf('hello')// return the location of the first occurrence of 'hello' in s, or -1 if not found !!!Mind Upper and Lower
s.substring(0,5); //截取字符串 从位置0开始到位置5结束，但不包括位置5
s.substring(7); //从位置7开始一直截取到字符串末尾

//数组 等于Python中的list
var arr = [1,2,3.14,'hello',null,true];// 数组是恶可以变化长度的
console.log(arr.length); //访问数组元素
arr.length = 6; //可以主动调整数组长度，如果没有定义其中的元素，就用undefined来进行填充
//给一个长度不够的数组，比如长度为6的数组，赋值一个位置为10的元素，那么这个数组就会自动调整长度为11，并且在位置6到位置9之间用undefined来填充//不建议直接修改array的大小和长度
arr.slice(0,3); //截取数组 从位置0开始到位置3结束，但不包括位置3
arr.slice(); //不传入参数，表示截取整个数组 即相当于复制一个数组
arr.slice(3); //从位置3开始一直截取到数组末尾
arr.push('world');  //在数组末尾添加一个元素，push函数会返回新的数组长度
arr.pop();//删除数组末尾的元素。并且pop函数会返回被删除的元素
// 在js中 === 对数组/对象比较的是：是不是同一个对象（同一块内存引用）//空数组继续pop不会报错，而是返回undefined
arr.unshift('first'); //在数组开头添加一个元素，unshift函数会返回新的数组长度。在数组的左侧添加元素，unshift函数会返回新的数组长度
arr.shift(); //删除数组开头的元素，并且shift函数会返回被删除的元素。在数组的左侧删除元素，shift函数会返回被删除的元素；和POP的相反
arr.sort(); //对数组进行排序，默认按照字符串的字典序进行排序.
arr.reverse(); //对数组进行反转

let arr1 = ['Microsoft', 'Apple', 'Yahoo', 'AOL', 'Excite', 'Oracle'];
arr1.splice(2, 3, 'Google', 'Facebook'); //从位置2开始删除3个元素，并且在位置2插入'Google'和'Facebook',并且返回的是被删除的元素
let arred = arr1.concat([1,2,3]); //连接两个数组，返回一个新的数组
arr1.join('-'); //把数组元素连接成一个字符串，元素之间用逗号分隔，返回的是一个字符串

//对象对象
let xiaowang = {
    name:'小王',
    age:18,
    city:'北京',
    hasCar:false,
    middleSchool:'北京第一中学',
     //对象的属性值可以是一个函数，这个函数叫做方法
    sayHello:function(){
        console.log(`你好, 我是${this.name}, 我今年${this.age}岁了!`);//this表示当前对象
    }
};
console.log(xiaowang.name); //编写js code的时候 属性名使用标准的英文单词，不能使用中文或者其他特殊字符，可以直接通过object.property的方式访问对象的属性
// 访问一个不存在的属性返回 undefined
delete xiaowang.hasCar; //删除对象的属性
'grade' in xiaowang; //判断对象是否有某个属性，返回true或者false
'toString' in xiaowang;//toString方法是所有对象都具有的一个方法，可以把对象转换成字符串 
xiaowang.hasOwnProperty('name'); //判断对象是否具有某个属性，返回true或者false; 判断是不是自身有的，而不是继承得来的。


let aage = 20;
if (age >=18){
    console.log('成年人');
}else{
    console.log('年龄小于18岁');
    console.log('未成年人');
}

let aaage = 20;
if (age >=6){
    console.log('成年人');
} else if (age >=6){
    console.log('青年');
}else {
    console.log('儿童');
}
//null undefined 0 '' false 都是false


let height = parseFloat(prompt('请输入身高(m):'));
let weight = parseFloat(prompt('请输入体重(kg):'));

// TODO:
let bmi = weight/height/height;
if (bmi<18.5){
    console.log('过轻');
} else if (bmi<25){
    console.log('正常');
} else if (bmi<28){
    console.log('过重');
} else if (bmi<32){
    console.log('肥胖');
} else {
    console.log('严重肥胖');
}

let x = 0;
let i;
for(i=1;i<=10000;i++){
    x += i;
} // i=1是初始条件；i<=10000是循环条件；i++是迭代条件，每次循环结束后执行的代码;


let y = 1;
let u;
for (u=1;u<=10;u++){
y *= u;
}

// for in 是用于判断k值的
let o = {
    name: 'Jack',
    age: 20,
    city: 'Beijing'
};
for (let key in o){
console.log(key)
}

// array是数组对象
let a = ['A', 'B', 'C'];
for (let i in a){
    console.log(i); //i是数组的索引 是数字数字 //for in 对array的循环得到的是string
}

//在循环完成时进行条件判断
let n = 0;
do {
    n = n+1;
} while (n<100); //先执行一次循环体，再判断条件是否满足，如果满足继续执行循环体，否则退出循环

console.log(n);

let arr = ['Bart', 'Lisa', 'Adam'];
let p;
for (i = 0; i < arr.length; i++) {
    console.log(`Hello, ${arr[i]}!`);
}


let arr = ['Bart', 'Lisa', 'Adam'];
let h = 0;
while(h<arr.length){
console.log(`hello,${arr[h]}!`);
h = h+1;
}


// Map数据结构；键值对的结构；
let m = new Map([['Michael', 95], ['Bob', 75], ['Tracy', 85]]); //这是一个字典对象；
m.get('Michael'); // 95 Map的get方法获取键对应的值

//如果要新开一个Map对象的话，如下
let m = new Map();
m.set('Michael', 95); // Map的set方法设置键值对  set()方法设置值
m.has('Michael'); // Map的has方法判断是否有某个键，返回true或者false
m.get('Michael'); // Map的get方法获取键对应的值
m.delete('Michael');//

//Set类型
//Set 是一组key的集合，但不储存value；Set中不存在重复的key；
