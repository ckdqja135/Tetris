// 충돌 감지 함수
function collides(board, piece) {
    const [m, o] = [piece.matrix, piece.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 블록 병합 함수
function merge(board, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0 && board[y + piece.pos.y] && board[y + piece.pos.y][x + piece.pos.x] !== undefined) {
                // 블록 타입에 해당하는 인덱스를 보드에 저장
                board[y + piece.pos.y][x + piece.pos.x] = PIECES.indexOf(piece.type) + 1;
            }
        });
    });
}

// 블록 회전 함수 (시계 방향으로 회전) - 경계를 벗어날 경우 보정
function rotatePiece(piece) {
    const matrix = piece.matrix;
    // Transpose and reverse the matrix (clockwise rotation)
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());

    // 경계를 벗어나는 경우 보정
    if (collides(board, piece)) {
        // 왼쪽으로 붙었을 때 보정
        if (piece.pos.x < 0) {
            piece.pos.x++;
        }
        // 오른쪽으로 붙었을 때 보정
        if (piece.pos.x + matrix[0].length > board[0].length) {
            piece.pos.x--;
        }
    }
}

// 그림자 블록 계산 함수
function calculateShadowPiece(piece) {
    const shadowPiece = JSON.parse(JSON.stringify(piece));
    while (!collides(board, shadowPiece)) {
        shadowPiece.pos.y++;
    }
    shadowPiece.pos.y--; // 충돌 직전 위치로 이동
    return shadowPiece;
}

// 라인 제거 함수
let linesCleared = 0;
let level = 1;
function removeLines() {
    let linesRemoved = 0;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesRemoved++;
        linesCleared++;

        // 레벨업 - 10줄마다 레벨업
        if (linesCleared >= level * 10) {
            level++;
            dropInterval = dropInterval * 0.8; // 레벨이 오를수록 속도가 체감되게 증가
        }
    }

    // 점수 추가: 지운 줄 수에 따라 다르게 부여
    if (linesRemoved === 1) {
        score += 100 * level;
    } else if (linesRemoved === 2) {
        score += 300 * level;
    } else if (linesRemoved === 3) {
        score += 500 * level;
    } else if (linesRemoved === 4) {
        score += 800 * level;
    }
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
}

// 랜덤 블록 생성 함수
const PIECES = 'IJLOSTZ';
// 다음 블록 배열 관리 (올바른 순서로 블록을 가져오고 출력)
function randomPiece() {
    const type = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
        type,
        matrix: createPieceMatrix(type),
        pos: { x: 3, y: 0 } // 기본 위치
    };
}

// 블록 모양 생성 함수
function createPieceMatrix(type) {
    switch (type) {
        case 'I':
            return [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ];
        case 'J':
            return [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];
        case 'L':
            return [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ];
        case 'O':
            return [
                [1, 1],
                [1, 1]
            ];
        case 'S':
            return [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ];
        case 'T':
            return [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];
        case 'Z':
            return [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ];
    }
}


// 작은 매트릭스 그리기 함수 (홀드 및 다음 블록 표시용)
function drawSmallMatrix(matrix, context, color, offsetX = 0, offsetY = 0) {
    context.fillStyle = color;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillRect(offsetX + x * 30, offsetY + y * 30, 30, 30);
                context.strokeStyle = 'black';
                context.strokeRect(offsetX + x * 30, offsetY + y * 30, 30, 30); // 경계선 추가
            }
        });
    });
}


// 홀드 블록을 중앙에 출력하는 함수
function drawHoldPiece() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height); // 캔버스 초기화
    if (holdPiece) {
        const holdMatrix = holdPiece.matrix;
        const centerX = Math.floor((holdCanvas.width - holdMatrix[0].length * 30) / 2);
        const centerY = Math.floor((holdCanvas.height - holdMatrix.length * 30) / 2);
        drawSmallMatrix(holdMatrix, holdCtx, colors[holdPiece.type], centerX, centerY);
    }
}
// 다음 5개의 블록을 출력하는 함수
function drawNextPieces() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height); // 캔버스 초기화
    nextPieces.forEach((piece, index) => {
        const nextMatrix = piece.matrix;
        const offsetX = Math.floor((nextCanvas.width - nextMatrix[0].length * 30) / 2); // X축 중앙 맞추기
        const offsetY = index * 100; // 블록 간 간격 조절 (Y축 위치를 100으로 증가시켜서 블록이 잘리지 않도록 설정)
        drawSmallMatrix(nextMatrix, nextCtx, colors[piece.type], offsetX, offsetY);
    });
}

// 보드 그리기 함수
function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height); // 이전 화면 지우기

    // 이미 떨어진 블록 그리기
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // 보드에 저장된 값에 따라 해당 블록 타입의 색상을 적용
                context.fillStyle = colors[PIECES[value - 1]];
                context.fillRect(x * 40, y * 40, 40, 40);
                context.strokeStyle = 'black'; // 경계선 추가
                context.strokeRect(x * 40, y * 40, 40, 40);
            }
        });
    });

    // 현재 블록 그리기
    currentPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[currentPiece.type]; // 블록 타입에 맞는 색상 설정
                context.fillRect((currentPiece.pos.x + x) * 40, (currentPiece.pos.y + y) * 40, 40, 40);
                context.strokeStyle = 'black'; // 경계선 추가
                context.strokeRect((currentPiece.pos.x + x) * 40, (currentPiece.pos.y + y) * 40, 40, 40);
            }
        });
    });

    // 그림자 블록 그리기
    shadowPiece = calculateShadowPiece(currentPiece); // 항상 블록의 현재 위치에 맞게 업데이트
    shadowPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'rgba(0, 0, 0, 0.3)'; // 투명한 그림자
                context.fillRect((shadowPiece.pos.x + x) * 40, (shadowPiece.pos.y + y) * 40, 40, 40);
            }
        });
    });
}


// 색상 배열 (블록 타입에 맞는 색상 지정)
const colors = {
    'I': '#00f0f0',
    'J': '#0000f0',
    'L': '#f0a000',
    'O': '#f0f000',
    'S': '#00f000',
    'T': '#a000f0',
    'Z': '#f00000'
};

// 필요한 변수 선언
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

let board = createBoard(10, 20); // 보드 생성
let score = 0;
let currentPiece = randomPiece();
let nextPieces = [randomPiece(), randomPiece(), randomPiece(), randomPiece(), randomPiece()]; // 5개 블록 미리보기
let holdPiece = null;
let shadowPiece = calculateShadowPiece(currentPiece);
let gameActive = false;
let gameOver = false;
let canHold = true;
let vKeyUsed = false; // v키가 한 번만 사용되도록 추가

// 보드 생성 함수
function createBoard(width, height) {
    const board = [];
    while (height--) {
        board.push(new Array(width).fill(0));
    }
    return board;
}

// 게임 업데이트 함수
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        currentPiece.pos.y++;
        if (collides(board, currentPiece)) {
            currentPiece.pos.y--;
            merge(board, currentPiece);
            if (checkGameOver()) {
                endGame();
                return;
            }
            removeLines();

            // 다음 블록을 가져와 현재 블록으로 설정
            currentPiece = nextPieces.shift(); // 다음 블록을 가져옴
            nextPieces.push(randomPiece()); // 새 블록을 생성하여 nextPieces에 추가
            shadowPiece = calculateShadowPiece(currentPiece); // 그림자 블록 계산
            canHold = true; // 블록이 떨어진 후 홀드 가능
            vKeyUsed = false; // v키 다시 사용할 수 있게 초기화
        }
        dropCounter = 0;
    }

    drawBoard();
    drawHoldPiece(); // 홀드 블록 그리기
    drawNextPieces(); // 다음 5개의 블록 그리기

    requestAnimationFrame(update);
}


// 키 입력 처리 함수
// 키 입력 처리 함수
function handleKeyPress(event) {
    if (!gameActive || gameOver) return;

    event.preventDefault(); // 방향키로 스크롤되지 않도록 설정
    if (event.key === ' ') {
        // 스페이스바: 블록을 최하단까지 빠르게 내리기
        while (!collides(board, currentPiece)) {
            currentPiece.pos.y++;
        }
        currentPiece.pos.y--;
        merge(board, currentPiece);
        removeLines();

        // 다음 블록을 가져와 현재 블록으로 설정
        currentPiece = nextPieces.shift(); // 다음 블록을 가져옴
        nextPieces.push(randomPiece()); // 새 블록을 생성하여 nextPieces에 추가
        shadowPiece = calculateShadowPiece(currentPiece); // 그림자 블록 계산
        canHold = true; // 블록이 떨어진 후 홀드 가능
        vKeyUsed = false; // 블록이 떨어졌으므로 v키 다시 사용할 수 있음
    } else if (event.key === 'ArrowLeft') {
        currentPiece.pos.x--;
        if (collides(board, currentPiece)) {
            currentPiece.pos.x++;
        }
    } else if (event.key === 'ArrowRight') {
        currentPiece.pos.x++;
        if (collides(board, currentPiece)) {
            currentPiece.pos.x--;
        }
    } else if (event.key === 'ArrowDown') {
        currentPiece.pos.y++;
        if (collides(board, currentPiece)) {
            currentPiece.pos.y--;
            merge(board, currentPiece);
            removeLines();

            // 다음 블록을 가져와 현재 블록으로 설정
            currentPiece = nextPieces.shift(); // 다음 블록을 가져옴
            nextPieces.push(randomPiece()); // 새 블록을 생성하여 nextPieces에 추가
            shadowPiece = calculateShadowPiece(currentPiece); // 그림자 블록 계산
            canHold = true; // 블록이 떨어진 후 홀드 가능
            vKeyUsed = false; // 블록이 떨어졌으므로 v키 다시 사용할 수 있음
        }
    } else if (event.key === 'z') {
        rotatePiece(currentPiece);
        if (collides(board, currentPiece)) {
            rotatePiece(currentPiece); // 원상복구 (좌우 이동 후에도 해결되지 않을 때)
            rotatePiece(currentPiece);
            rotatePiece(currentPiece);
        }
    } else if (event.key === 'c' && canHold) {
        // C 키: 홀드 기능
        if (holdPiece) {
            let temp = currentPiece;
            currentPiece = holdPiece;
            holdPiece = temp;
            currentPiece.pos = { x: 3, y: 0 }; // 교체 후 위치 초기화
        } else {
            holdPiece = currentPiece;
            currentPiece = nextPieces.shift(); // 다음 블록 가져오기
            currentPiece.pos = { x: 3, y: 0 }; // 위치 초기화
            nextPieces.push(randomPiece()); // 새로운 블록 추가
        }
        canHold = false; // 한 번만 홀드 가능
        drawHoldPiece(); // 홀드 블록 출력
    } else if (event.key === 'v' && !vKeyUsed && holdPiece) {
        // V 키: 한 번만 교체 가능 (vKeyUsed 플래그로 제어)
        let temp = currentPiece;
        currentPiece = holdPiece;
        holdPiece = temp;
        currentPiece.pos = { x: 3, y: 0 }; // 위치 초기화
        shadowPiece = calculateShadowPiece(currentPiece); // 그림자 블록 계산
        drawHoldPiece(); // 홀드 블록 다시 그리기
        vKeyUsed = true; // v키는 한 번만 사용 가능하도록 설정
    }
}

// 키 입력 이벤트 리스너 등록
document.addEventListener('keydown', handleKeyPress);

// 필요한 변수 선언
let dropCounter = 0;
let dropInterval = 1000;  // 블록이 자동으로 떨어지는 시간 간격 (1초)
let lastTime = 0;

// 게임 오버 체크 함수
function checkGameOver() {
    // 블록 병합 후에 보드 상단에 블록이 있는지 체크
    return board[0].some(cell => cell !== 0);  // 보드 첫 번째 줄에 블록이 있으면 게임 오버
}

// 게임 오버 처리 함수
function endGame() {
    gameActive = false;
    gameOver = true;
    alert('게임 오버! 점수: ' + score);
}

// 게임 시작 버튼 이벤트 핸들러
document.getElementById('startButton').addEventListener('click', () => {
    if (!gameActive) {
        gameActive = true;
        gameOver = false;
        score = 0;
        linesCleared = 0;
        level = 1;
        board = createBoard(10, 20); // 새로운 보드 생성
        currentPiece = randomPiece(); // 새로운 블록 생성
        nextPieces = [randomPiece(), randomPiece(), randomPiece(), randomPiece(), randomPiece()]; // 다음 블록 5개 생성
        holdPiece = null;
        shadowPiece = calculateShadowPiece(currentPiece); // 새로운 그림자 블록
        canHold = true; // 홀드 기능 초기화
        vKeyUsed = false; // v키 사용 초기화
        lastTime = 0; // 시간 초기화
        dropCounter = 0; // 드롭 카운터 초기화
        dropInterval = 1000; // 속도 초기화
        update(); // 게임 업데이트 시작
    }
});
