import * as fs from 'fs';

function convertToDiagonalData(gridSize: number) {
    const diagonalData: string[][] = [];

    // 遍历每个二维数组的元素
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const diagonalIndex = row + col; // 对角线索引
            if (!diagonalData[diagonalIndex]) {
                diagonalData[diagonalIndex] = []; // 如果该对角线索引没有数组，先初始化
            }
            diagonalData[diagonalIndex].push(`(${row},${col})`);
        }
    }

    return diagonalData;
}

const gridSize = 10;
const diagonalData = convertToDiagonalData(gridSize);
console.log(diagonalData);
// 报存到json文件中
fs.writeFileSync('diagonalData.json', JSON.stringify(diagonalData, null, 2));

function generateCoordinateMapping(gridSize: number, tileSize: number) {
    const centerX = gridSize * tileSize / 2;
    const centerY = gridSize * tileSize / 2;
  
    const coordinateMapping = {};
  
    // 遍历每个坐标点 (row, col)
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // 计算 x 和 y 坐标
        const x = centerX + (col - row) * (tileSize / 2);
        const y = centerY + (col + row - (gridSize - 1)) * (tileSize / 2);
        
        // 将坐标 (row, col) 映射为对应的 {x, y} 值
        coordinateMapping[`${row},${col}`] = { x, y };
      }
    }
  
    return coordinateMapping;
  }
  
  const tileSize = 50; // 每个地砖大小 50×50
  
  const mapping = generateCoordinateMapping(gridSize, tileSize);
  // 将生成的数据保存到json文件中
  fs.writeFileSync('mapping.json', JSON.stringify(mapping, null, 2));
  console.log(mapping);

