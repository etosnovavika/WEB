const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');

const config = {
    strokeStyle: 'ivory',
    fillStyle: 'dimgray',
    radius: 200, // пикселей, соответствует логическому R
};


const cx = () => canvas.width / 2;
const cy = () => canvas.height / 2;


function px(x, R) {
    return cx() + (x * config.radius) / R;
}
function py(y, R) {
    return cy() - (y * config.radius) / R;
}

function isInside(x, y, r) {
    // полуокружность
    const leftCircle = (x <= 0) && (y >= 0) && (x*x +y*y <= (r/2) * (r/2));

    // треугольник
    const triangle = (x <= 0) && (y <= 0) && (y >= - x - r/2) && (y >= -r);

    // прямоугольник
    const rect = (x >= 0) && (x <= r) && (y <= 0) && (y >= -r);

    return leftCircle || triangle || rect;
}


function drawAxis() {
    ctx.save();
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // X axis
    ctx.moveTo(0, cy());
    ctx.lineTo(canvas.width, cy());
    // Y axis
    ctx.moveTo(cx(), 0);
    ctx.lineTo(cx(), canvas.height);
    ctx.stroke();
    ctx.restore();

    drawArrows();
    drawCenterPoint();
}

function drawArrows() {
    ctx.save();
    ctx.strokeStyle = config.strokeStyle;
    ctx.fillStyle = config.strokeStyle;
    ctx.lineWidth = 2;

    // X axis arrow (right)
    ctx.beginPath();
    ctx.moveTo(canvas.width - 12, cy() - 6);
    ctx.lineTo(canvas.width, cy());
    ctx.lineTo(canvas.width - 12, cy() + 6);
    ctx.stroke();

    // Y axis arrow (top)
    ctx.beginPath();
    ctx.moveTo(cx() - 6, 12);
    ctx.lineTo(cx(), 0);
    ctx.lineTo(cx() + 6, 12);
    ctx.stroke();

    ctx.restore();
}

function drawCenterPoint() {
    ctx.save();
    ctx.fillStyle = config.strokeStyle;
    ctx.beginPath();
    ctx.arc(cx(), cy(), 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}


function drawBoundaryByScan(R) {
    ctx.save();
    ctx.fillStyle = config.fillStyle;
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = 1;

    ctx.beginPath();

//полуокружность
    ctx.arc(px(0, R), py(0, R), Math.abs( px(0, R)- px(R/2, R)), -Math.PI/2, -Math.PI, true);
    ctx.lineTo(px(0, R), py(0, R));


    // треугольник
    ctx.moveTo(px(0, R), py(0, R));      // центр (0,0)
    ctx.lineTo(px(-R/2, R), py(0, R));   // (-R/2, 0)
    ctx.lineTo(px(0, R), py(-R/2, R));   // (0, -R/2)
    ctx.closePath();

    // прямоугольник
    const rectLeft = px(0, R);
    const rectTop = py(0, R);
    const rectWidth = px(R, R) - px(0, R);
    const rectHeight = py(-R, R) - py(0, R);
    ctx.rect(rectLeft, rectTop, rectWidth, rectHeight);

    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawLabels(R) {
    ctx.save();
    ctx.fillStyle = config.strokeStyle;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // по оси X: -R, -R/2, 0, R/2, R
    const xvals = [
        {x: -R, label: '-R'},
        {x: -R/2, label: '-R/2'},
        {x: 0, label: '0'},
        {x: R/2, label: 'R/2'},
        {x: R, label: 'R'}
    ];
    xvals.forEach(v => {
        const xpix = px(v.x, R);
        const ypix = py(0, R);
        ctx.fillText(v.label, xpix, ypix - 18);
    });

    // по оси Y: R, R/2, -R/2, -R
    const yvals = [
        {y: R, label: 'R'},
        {y: R/2, label: 'R/2'},
        {y: -R/2, label: '-R/2'},
        {y: -R, label: '-R'}
    ];
    yvals.forEach(v => {
        const xpix = px(0, R);
        const ypix = py(v.y, R);

        ctx.fillText(v.label, xpix + 18, ypix);
    });

    ctx.restore();
}


const points = [];

function drawPoints() {
    points.forEach(p => drawPoint(p));
}

function drawPoint(p) {
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}


function insertPoint(x, y, r) {
    const point = {
        realX: x,
        realY: y,
        x: px(x, r),
        y: py(y, r)
    };
    points.push(point);
    // рисуем точку поверх текущего холста
    drawPoint(point);
}

// пересчитать координаты точек при смене R
function refreshPoints(newR) {
    points.forEach(point => {
        point.x = px(point.realX, newR);
        point.y = py(point.realY, newR);
    });
}

function drawPlot(currentR = 2) {
    // очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // рисуем фон

    // оси
    drawAxis();

    // область попадания
    drawBoundaryByScan(currentR);

    // метки и точки поверх
    drawLabels(currentR);
    drawPoints();
}

//  функция для обновления
function refresh(R) {
    // обновляем точки по новому R и перерисовываем
    refreshPoints(R);
    drawPlot(R);
}

// первоначальную отрисовку
drawPlot(2);

window.plot = {
    drawPlot,
    drawBoundaryByScan,
    insertPoint,
    refreshPoints,
    refresh,
    // isInside,
    px,
    py,
};