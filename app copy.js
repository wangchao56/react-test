function getTileCoordinates(row, col, gridSize, tileSize) {
    // 计算每个坐标的 x, y
    const centerX = gridSize * tileSize / 2;
    const centerY = gridSize * tileSize / 2;
  
    const x = centerX + (col - row) * (tileSize / 2) - tileSize / 2;
    const y = centerY + (col + row - (gridSize - 1)) * (tileSize / 2) - tileSize / 2;
  
    return { x, y };
  }
  
  // 计算大地砖的区域，返回大地砖的边界
  function getBigTileBounds(coordinates, gridSize, tileSize) {
    const positions = coordinates.map(coord => {
      const [row, col] = coord;
      return getTileCoordinates(row, col, gridSize, tileSize);
    });
  
    const xCoords = positions.map(p => p.x);
    const yCoords = positions.map(p => p.y);
  
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
  
    return { minX, maxX, minY, maxY };
  }
  
  // 绘制普通地砖的函数
  function drawGrid(canvas, gridSize, tileSize, bigTileBounds) {
    const ctx = canvas.getContext('2d');
  
    // 绘制普通地砖，并避开大地砖区域
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const { x, y } = getTileCoordinates(row, col, gridSize, tileSize);
  
        // 检查地砖是否在大地砖区域内
        if (x >= bigTileBounds.minX && x <= bigTileBounds.maxX && y >= bigTileBounds.minY && y <= bigTileBounds.maxY) {
          continue; // 跳过已经铺设大地砖的区域
        }
  
        // 绘制普通地砖
        ctx.fillStyle = (row + col) % 2 === 0 ? '#e0e0e0' : '#f5f5f5';
        ctx.fillRect(x, y, tileSize, tileSize);
  
        // 绘制边框
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileSize, tileSize);
  
        // 绘制对角线
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + tileSize, y + tileSize);
        ctx.stroke();
      }
    }
  }
  
  // 绘制大地砖的函数
  function drawBigTileFromCoordinates(canvas, coordinates, gridSize, tileSize) {
    const ctx = canvas.getContext('2d');
  
    // 获取所有小地砖的 x, y 坐标
    const positions = coordinates.map(coord => {
      const [row, col] = coord;
      return getTileCoordinates(row, col, gridSize, tileSize);
    });
  
    // 计算大地砖的宽度和高度
    const { minX, maxX, minY, maxY } = getBigTileBounds(coordinates, gridSize, tileSize);
  
    // 计算大地砖的宽度和高度
    const width = maxX - minX + tileSize;  // 加上一个 tileSize 使得大地砖包含所有小地砖
    const height = maxY - minY + tileSize;
  
    // 计算大地砖的位置
    const posX = minX;
    const posY = minY;
  
    // 绘制大地砖的外部矩形
    ctx.fillStyle = '#e0e0e0';  // 大地砖的背景色
    ctx.fillRect(posX, posY, width, height);
  
  
    return { minX, maxX, minY, maxY }; // 返回大地砖的边界
  }
  
  // 获取 canvas 元素
  const canvas = document.getElementById('canvas');
  const gridSize = 10; // 网格大小 10×10
  const tileSize = 50; // 每个地砖的大小
  
  // 定义大地砖的坐标区域 ["(4,6)","(4,7)","(4,8)","(5,6)","(5,7)","(5,8)","(6,6)","(6,7)","(6,8)"]
  const bigTileCoordinates = [
    [4, 6], [4, 7], [4, 8],
    [5, 6], [5, 7], [5, 8],
    [6, 6], [6, 7], [6, 8]
  ];
  
  // 1. 先绘制普通地砖，避免大地砖区域
  const bigTileBounds = getBigTileBounds(bigTileCoordinates, gridSize, tileSize);
  drawGrid(canvas, gridSize, tileSize, bigTileBounds);
  
  // 2. 再绘制大地砖，确保大地砖位于所有地砖之上
  drawBigTileFromCoordinates(canvas, bigTileCoordinates, gridSize, tileSize);
  