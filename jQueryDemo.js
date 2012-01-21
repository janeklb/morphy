
function jQueryChessBoard(elementId) {
	
	var chessBoard = new ChessBoard();
	
	var $chessBoard = $('#' + elementId);
	
	for (var r = 0, i = 0, $row; r < 8; r++) {
		
		$row = $('<div class="row cf" />');
		
		for (var f = 0, $cell, piece, $piece; f < 8; f++) {
			$cell = $('<div class="square" />');
			$cell.addClass((++i % 2 == 0) ? 'black' : 'white');
			$cell.addClass('square_' + FILES[f] + ROWS[r]);
			
			// add pieces
			if (piece = chessBoard.getPiece(r, f)) {
				$piece = $('<div class="piece" />');
				$piece.addClass(piece.type);
				$piece.html(piece.piece);
				$piece.data('piece', piece);
				
				$cell.append($piece);
			}
			
			$row.append($cell);
		}
		
		++i;
		
		$chessBoard.append($row);
	}
	
	$('.square').droppable({
		accept: '.piece',
		activate: function(event, ui) {
			
		},
		deactivate: function(event, ui) {
//			console.log(ui);
		},
		drop: function() {
			
		}
	});
	
	$('.piece').draggable({
		start: function() {
			var piece = $(this).data('piece'),
				validMoves = piece.validMoves(chessBoard);
			
			console.log(validMoves);
			
		}
	});
}

$(document).ready(function() {

	var x = new jQueryChessBoard('chessBoard');
});