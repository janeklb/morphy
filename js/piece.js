/**
 * Initialize a chesspiece
 * TODO:
 * en passant: need to notify which piece gets taken (since you don't specifically land on it)
 * castling: not implemented at all
 * 
 * @param string piece FEN piece character
 * @param integer row
 * @param integer file
 * @param integer id the ID of the piece (used for reverse lookup in ChessBoard)
 * @return
 */
function ChessPiece(piece, row, file, id) {
	
	this.validmovesPawn = function(board) {
		
		var validMoves = [];
		var distance = false;
		var starting = false;
		var row = this.row;
		var file = this.file;
		
		if (this.colour == 'w') {
			distance = 1;
			starting = row == 1;
		} else {
			distance = -1;
			starting = row == 6;
		}
		
		// check one move ahead
		if (!board.getPiece(row + distance, file)) {
			
			validMoves.push([row + distance, file, 'm']);
			
			// two moves ahead if we're on the starting row
			if (starting && !board.getPiece(row + (2 * distance), file)) {
				validMoves.push([row + (2 * distance), file, 'm']);
			}
		}
		
		// attackable squares
		var coords = [];
		if (file > 0) {
			coords.push([row + distance, file - 1]);
		}
		if (file < 7) {
			coords.push([row + distance, file + 1]);
		}
		
		var i = coords.length;
		while (i--) {
			
			var tmp = board.getPiece(coords[i][0], coords[i][1]);
			if (tmp && tmp.isOppositeColour(this)) {
				validMoves.push([coords[i][0], coords[i][1], 'a']);
			}
			
			// check for en passant attacks
			var coordString = coords[i][0] + coords[i][1];
			if (coordString == board.enpassant) {
				var enpCoords = board.validTextCoordinate(coordString);
				validMoves.push([enpCoords.row, enpCoords.file, 'a']);
			}
		}
		
		return validMoves;
	};
	
	this.validmovesKnight = function(board) {
		
		var validMoves = [];
		
		var i = KNIGHT_MOVES.length;
		while (i--) {
			var move = KNIGHT_MOVES[i];
			try {
				var piece = board.getPiece(this.row + move[0], this.file + move[1]);
				if (!piece || piece.isOppositeColour(this)) {
					validMoves.push([this.row + move[0], this.file + move[1]]);
				}
			} catch (e) {
				// out of bounds will fall in here
			}
		}
		
		return validMoves;
	};
	
	this.validmovesBishop = function(board) {
		return this.validateDirections(board, BISHOP_DIRECTIONS);
	};
	this.validmovesRook = function(board) {
		return this.validateDirections(board, ROOK_DIRECTIONS);
	};
	this.validmovesQueen = function(board) {
		return this.validateDirections(board, ROOK_DIRECTIONS.concat(BISHOP_DIRECTIONS));
	};
	this.validmovesKing = function(board) {
		
		// traverse through all available moves in search for attacked squares
		var validMoves = this.validateDirections(board, ROOK_DIRECTIONS.concat(BISHOP_DIRECTIONS), 1);
		var m = validMoves.length;
		while (m--) {
			
			var row = validMoves[m][0];
			var file = validMoves[m][1];
			
			if (board.squareIsAttacked(row, file, this.colour == 'w' ? 'b' : 'w')) {
				validMoves.splice(m, 1);
			}
		}
		
		return validMoves;
	};
	
	this.validateDirections = function(board, directions, maxDist) {
		var validMoves = [];
		
		if (typeof(maxDist) == 'undefined') {
			maxDist = 8;
		}
		
		var i = directions.length;
		while (i--) {
			var d = directions[i];
			var dist = 1;
			
			while (dist <= maxDist) {
				var newRow = d[0] * dist + this.row;
				var newFile = d[1] * dist +  this.file;
				try {
					var piece = board.getPiece(newRow, newFile);
					if (!piece) {
						validMoves.push([newRow, newFile]);
						dist++;
					} else if (piece.isOppositeColour(this)) {
						validMoves.push([newRow, newFile]);
						break;
					} else {
						break;
					}
				} catch (e) {
					// end of board
					break;
				}
			}
		}
		
		return validMoves;
	};
	
	this.init(piece, row, file, id);
}

/**
 * Initialize a chesspiece
 * @param string piece FEN piece character
 * @param integer row
 * @param integer file
 * @param integer id the ID of the piece (used for reverse lookup in ChessBoard)
 * @return
 */
ChessPiece.prototype.init = function(piece, row, file, id) {
	
	this.piece	= piece;
	this.type	= piece.toLowerCase();
	
	if (!this.isValidPiece(this.type)) {
		throw 'Piece invalid ' + piece;
	}
	
	this.row 	= row;
	this.file 	= file;
	this.id 	= id;
	this.colour = piece == piece.toLowerCase() ? 'b' : 'w';
};

/**
 * Returns a list of valid moves for this piece
 * @param board
 * @return array an array of moves (eg. [[1,4],[1,5]]
) */
ChessPiece.prototype.validMoves = function(board) {
	switch (this.type) {
		case 'p': return this.validmovesPawn(board);
		case 'n': return this.validmovesKnight(board);
		case 'b': return this.validmovesBishop(board);
		case 'r': return this.validmovesRook(board);
		case 'q': return this.validmovesQueen(board);
		case 'k': return this.validmovesKing(board);
		default: throw 'Unknown piece ' + this.type;
	}
};

ChessPiece.prototype.isValidPiece = function(type) {
	return PIECES.indexOf(type) != -1;
};

ChessPiece.prototype.isOppositeColour = function(piece) {
	return this.colour != piece.colour;
};

