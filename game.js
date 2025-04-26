const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let platforms;
let cursors;
let enemies;
let goal;

const game = new Phaser.Game(config);

function preload () {
    // 本示例不需要预加载外部资源
}

function create () {
    // 添加背景（如果已加载）
    // this.add.image(400, 300, 'sky');

    // 创建平台组
    platforms = this.physics.add.staticGroup();

    // 创建地面
    // platforms.create(400, 568, 'ground').setScale(2).refreshBody(); // 使用图片
    platforms.create(400, 580, null, { isStatic: true }).setScale(20, 1).refreshBody(); // 使用无图矩形代替地面
    platforms.children.entries[0].setSize(800, 20).setOffset(0, 10); // 调整碰撞体积
    platforms.children.entries[0].tint = 0x00ff00; // 给地面上色


    // 创建一些平台
    // platforms.create(600, 400, 'ground');
    // platforms.create(50, 250, 'ground');
    // platforms.create(750, 220, 'ground');
    platforms.create(600, 400, null, { isStatic: true }).setScale(5, 0.5).refreshBody().tint = 0x00ff00;
    platforms.create(50, 250, null, { isStatic: true }).setScale(3, 0.5).refreshBody().tint = 0x00ff00;
    platforms.create(750, 220, null, { isStatic: true }).setScale(4, 0.5).refreshBody().tint = 0x00ff00;


    // 创建玩家 (使用无图矩形)
    player = this.physics.add.sprite(100, 450, null);
    player.setSize(32, 48); // 设置玩家大小
    player.setOrigin(0.5, 0.5);
    // 创建一个可见的矩形图形来代表玩家
    const playerGraphics = this.add.graphics({ fillStyle: { color: 0xff0000 } });
    const playerRect = new Phaser.Geom.Rectangle(-player.width / 2, -player.height / 2, player.width, player.height);
    playerGraphics.fillRectShape(playerRect);
    // 将图形附加到物理精灵上，这样它会随精灵移动
    playerGraphics.x = player.x;
    playerGraphics.y = player.y;
    player.setData('graphics', playerGraphics); // 存储图形引用以便更新位置

    player.setBounce(0.2);
    player.setCollideWorldBounds(true); // 防止玩家走出边界，除了底部

    // 由于未使用精灵图，因此不需要动画

    // 添加碰撞检测
    this.physics.add.collider(player, platforms);

    // 创建键盘输入监听
    cursors = this.input.keyboard.createCursorKeys();

    // 创建敌人组
    enemies = this.physics.add.group();

    // 创建一个敌人实例
    const enemy = enemies.create(600, 350, null);
    enemy.setSize(32, 32); // 设置敌人大小
    enemy.setOrigin(0.5, 0.5);
    const enemyGraphics = this.add.graphics({ fillStyle: { color: 0x0000ff } }); // 蓝色敌人
    const enemyRect = new Phaser.Geom.Rectangle(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
    enemyGraphics.fillRectShape(enemyRect);
    enemyGraphics.x = enemy.x;
    enemyGraphics.y = enemy.y;
    enemy.setData('graphics', enemyGraphics);
    enemy.setData('patrolDirection', 1); // 1 for right, -1 for left
    enemy.setData('patrolDistance', 100); // 巡逻距离
    enemy.setData('initialX', enemy.x);
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(1); // 完全反弹
    enemy.setVelocityX(100 * enemy.getData('patrolDirection')); // 初始速度

    // 添加敌人与平台的碰撞
    this.physics.add.collider(enemies, platforms);

    // 添加玩家与敌人的重叠检测
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);

    // 创建通关目标 (例如一个黄色矩形在右上角平台)
    goal = this.physics.add.sprite(750, 180, null);
    goal.setSize(40, 40);
    goal.setOrigin(0.5, 0.5);
    const goalGraphics = this.add.graphics({ fillStyle: { color: 0xffff00 } }); // 黄色目标
    const goalRect = new Phaser.Geom.Rectangle(-goal.width / 2, -goal.height / 2, goal.width, goal.height);
    goalGraphics.fillRectShape(goalRect);
    goalGraphics.x = goal.x;
    goalGraphics.y = goal.y;
    goal.setData('graphics', goalGraphics);
    goal.body.allowGravity = false; // 目标不受重力影响
    goal.body.immovable = true; // 目标不会被推动

    // 添加玩家与目标的重叠检测
    this.physics.add.overlap(player, goal, reachGoal, null, this);
}

function update () {
    // 玩家移动控制
    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);
    }
    else
    {
        player.setVelocityX(0);
    }

    // 跳跃控制 (只能在接触地面时跳跃)
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }

    // 更新玩家图形的位置以匹配物理精灵
    const playerGraphics = player.getData('graphics');
    if (playerGraphics) {
        playerGraphics.x = player.x;
        playerGraphics.y = player.y;
    }

    // 更新敌人状态和图形位置
    enemies.children.iterate(function (enemy) {
        const enemyGraphics = enemy.getData('graphics');
        if (enemyGraphics) {
            enemyGraphics.x = enemy.x;
            enemyGraphics.y = enemy.y;
        }

        // 简单的左右巡逻逻辑
        const initialX = enemy.getData('initialX');
        const patrolDistance = enemy.getData('patrolDistance');
        const direction = enemy.getData('patrolDirection');

        if (direction === 1 && enemy.x >= initialX + patrolDistance) {
            enemy.setVelocityX(-100);
            enemy.setData('patrolDirection', -1);
        } else if (direction === -1 && enemy.x <= initialX - patrolDistance) {
            enemy.setVelocityX(100);
            enemy.setData('patrolDirection', 1);
        }
        // 确保敌人碰到世界边界或平台时也能反弹（已通过 setBounce(1) 和 setCollideWorldBounds 实现部分）
    });

    // 检查玩家是否掉落
    if (player.y > config.height + player.height) { // 稍微增加判断边界，确保完全掉出
        this.scene.restart(); // 重新开始场景
    }
}

// 玩家碰到敌人时的回调函数
function hitEnemy (player, enemy)
{
    this.physics.pause(); // 暂停物理引擎
    player.setTint(0xff0000); // 玩家变红
    // 可以在这里添加游戏结束的文字或效果
    // player.anims.play('turn'); // 如果有动画

    // 短暂延迟后重启场景
    this.time.delayedCall(1000, () => {
        this.scene.restart();
    });
}

// 玩家到达目标时的回调函数
function reachGoal (player, goal)
{
    this.physics.pause(); // 暂停物理引擎
    player.setTint(0x00ff00); // 玩家变绿
    goal.disableBody(true, true); // 禁用目标
    const goalGraphics = goal.getData('graphics');
    if(goalGraphics) goalGraphics.destroy(); // 移除目标图形

    // 显示胜利信息
    let winText = this.add.text(config.width / 2, config.height / 2, 'You Win!', { fontSize: '64px', fill: '#fff' });
    winText.setOrigin(0.5);

    // 短暂延迟后重启场景 (或者跳转到下一关)
    this.time.delayedCall(2000, () => {
        this.scene.restart();
    });
}