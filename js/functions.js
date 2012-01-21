var rowCoords = [-375,-265,-155,-45,45,155,265,375];
var fileCoords = [-370,-260,-160,-50,50,160,260,370];
var pieceMap = {
		'k':'king',
//		'q':'queen',
		'r':'rook',
//		'b':'bishop',
		'n':'knight',
		'p':'pawn'
};

function loadFEN(fenString) {
	
	try {
		cMorphy.loadFEN(fenString);
		renderBoard(true);
	} catch (e) {
		alert(e);
	}
}

function renderBoard(nicecoords) {
	
	var boardString = '';
	var row = cMorphy.board.length;
	while (row--) {
		
		boardString += nicecoords ? ROWS[row] : row;
		
		boardString += '   ';
		
		for (var file in cMorphy.board[row]) {
			var piece = cMorphy.board[row][file];
			boardString += (piece ? piece.piece : ' ') + ' ';
		}
		boardString += "\n";
	}
	
	boardString += "\n    ";
	for (var i = 0; i < 8; i++) {
		boardString += nicecoords ? FILES[i] : i;
		boardString += ' ';
	}
	
	document.getElementById('chessboard').innerHTML = boardString;
}

function doMove() {
	
	var from = document.getElementById('from').value;
	var to = document.getElementById('to').value;
	
	try {
		tPiece = cMorphy.doMove(from, to);
		renderBoard(true);
	} catch (e) {
		alert(e);
	}
	
}

function grabFEN() {
	fenstring = document.getElementById('fen').value = cMorphy.getFEN();
}