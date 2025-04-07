// import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import mmallCart from './schema/cart.js';
import mmallCategory from './schema/category.js';
import mmallOrder from './schema/order.js';
import mmallOrderItem from './schema/order-item.js';
import mmallProduct from './schema/product.js';
import mmallShipping from './schema/shipping.js';
import mmallUser from './schema/user.js';
import mmallPayInfo from './schema/pay-info.js';

// 创建数据库连接池
const poolConnection = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'mmall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = drizzle(poolConnection);

// 插入数据函数
async function insertData() {
    try {
        // 插入购物车数据
        await db.insert(mmallCart).values({
            userId: 21,            // 用户ID，假设是1
            productId: 26,       // 商品ID，假设是123
            quantity: 1,          // 商品数量，假设是2
            checked: 1,           // 是否选中，假设是选中（1代表选中，0代表未选中）
            createTime: new Date(),
            updateTime: new Date(),
        });

        // 插入类别数据
        await db.insert(mmallCategory).values({
            parentId: 0,             // 根节点, 一级类别
            name: '家用电器',     // 类别名称
            status: 1,               // 状态: 1 - 正常
            // sortOrder: 1,            // 排序编号
            createTime: new Date(),
            updateTime: new Date(),
        });

        // 插入订单数据
        await db.insert(mmallOrder).values({
            orderNo: 1234567890n,   // 订单号 (使用 BigInt 类型的值)
            userId: 1,              // 用户ID
            shippingId: 25,          // 收货地址ID
            payment: 199.99,        // 实际付款金额
            paymentType: 1,         // 支付类型: 1-在线支付
            postage: 10,            // 运费
            status: 20,             // 订单状态: 20-已付款
            paymentTime: new Date(),// 支付时间
            sendTime: new Date(),   // 发货时间
            endTime: new Date(),    // 交易完成时间
            closeTime: null,        // 交易关闭时间
            createTime: new Date(), // 创建时间
            updateTime: new Date(), // 更新时间
        });

        // 插入订单项数据
        await db.insert(mmallOrderItem).values({
            userId: 1,              // 用户ID
            orderNo: 1234567890n,   // 订单号 (BigInt 类型)
            productId: 101,         // 商品ID
            productName: 'Apple iPhone 7 Plus (A1661) 128G 玫瑰金色 移动联通电信4G手机', // 商品名称
            productImage: 'https://example.com/mouse.jpg', // 商品图片地址
            currentUnitPrice: 6999.99, // 当前商品单价
            quantity: 2,            // 商品数量
            totalPrice: 13998.00,      // 商品总价 (单价 * 数量)
            createTime: new Date(), // 创建时间
            updateTime: new Date(), // 更新时间
        });

        // 插入支付信息数据
        await db.insert(mmallPayInfo).values({
            userId: 1,               // 用户ID
            orderNo: 1234567890n,    // 订单号 (BigInt 类型)
            payPlatform: 1,          // 支付平台: 1-支付宝
            platformNumber: '2023101234567890', // 支付流水号
            platformStatus: 'SUCCESS', // 支付宝支付状态: 成功
            createTime: new Date(),  // 创建时间
            updateTime: new Date(),  // 更新时间
        });

        // 插入商品数据
        await db.insert(mmallProduct).values({
            categoryId: 1,                // 分类ID，假设为1
            name: 'Example Product',       // 商品名称
            subtitle: 'This is a sample product.',  // 商品副标题
            mainImage: 'path/to/main/image.jpg',  // 商品主图的URL地址
            subImages: JSON.stringify(['image1.jpg', 'image2.jpg']),  // 商品的多个图片地址 (JSON格式)
            detail: 'This is a detailed description of the product.', // 商品详情
            price: 99.99,                  // 商品价格
            stock: 100,                    // 商品库存
            status: 1,                     // 商品状态 (1 - 在售)
            createTime: new Date(),        // 创建时间
            updateTime: new Date(),        // 更新时间
        });

        // 插入收货信息数据
        await db.insert(mmallShipping).values({
            userId: 123,  // 用户id，假设为123
            receiverName: 'John Doe',  // 收货姓名
            receiverPhone: '1234567890',  // 收货固定电话
            receiverMobile: '0987654321',  // 收货移动电话
            receiverProvince: 'Beijing',  // 省份
            receiverCity: 'Beijing',      // 城市
            receiverDistrict: 'Chaoyang', // 区/县
            receiverAddress: 'Example Street, No. 10', // 详细地址
            receiverZip: '100000',         // 邮编
            createTime: new Date(),        // 创建时间
            updateTime: new Date(),        // 更新时间
        });

        // 插入用户数据
        await db.insert(mmallUser).values({
            username: 'johndoe',     // 用户名
            password: 'hashedpassword',  // 用户密码（假设已加密）
            email: 'johndoe@example.com',  // 用户邮箱
            phone: '1234567890',     // 用户电话号码
            question: '母亲的名字是什么?', // 找回密码问题
            answer: 'Alice',         // 找回密码答案
            role: 1,                 // 用户角色（假设是普通用户）
            createTime: new Date(),  // 创建时间
            updateTime: new Date(),  // 最后更新时间
        });

  
        await poolConnection.end();
      } catch (error) {
        // 捕获错误并返回失败的响应
        console.error('Database connection failed:', error);
    }
}

// 执行数据插入
insertData().catch((err) => console.error('插入数据失败:', err));
