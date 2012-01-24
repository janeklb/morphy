
function jQueryChessBoard(elementId) {
	
	var chessBoard = new ChessBoard();
	
	var $chessBoard = $('#' + elementId);
	$chessBoard.children().remove();
	
	for (var r = 0, i = 0, $row; r < 8; r++) {
		
		$row = $('<div class="row cf" />');
		
		for (var f = 0, $cell, piece, $piece; f < 8; f++) {
			$cell = $('<div class="square" />');
			$cell.addClass((++i % 2 == 0) ? 'white' : 'black');
			$cell.attr('id', FILES[f] + ROWS[r]);
			$cell.data({row: r, file: f});
			
			// add pieces
			if (piece = chessBoard.getPiece(r, f)) {
				$piece = $('<div class="piece" />');
				$piece.addClass(piece.type);
				$piece.addClass('colour_' + piece.colour);
				
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
		drop: function(event, ui) {
			if ($(this).hasClass('active')) {
				$(ui.draggable).css({top:0,left:0});
				
				$(this).children().remove();
				$(ui.draggable).appendTo(this);
				
				var piece = $(ui.draggable).data('piece');
				
				chessBoard.doMove({
					row: piece.row,
					file: piece.file
				}, {
					row: $(this).data('row'),
					file: $(this).data('file')
				});
				
				$('#FENLog').append(chessBoard.getFEN() + "\n");
				
				setActivePieces();
				
			} else {
				$(ui.draggable).data('reset', true);
			}
		}
	});
	
	$('.piece').draggable({
		start: function() {
			var piece = $(this).data('piece'),
				validMoves = piece.validMoves(chessBoard);
			
			$(validMoves).each(function(index, move) {
				$('#' + FILES[move[1]] + ROWS[move[0]]).addClass('active');
			});
		},
		stop: function(event, ui) {
			$('.square').removeClass('active');
			if ($(this).data('reset')) {
				$(this).removeData('reset');
				$(this).css(ui.originalPosition);
			}
		}
	});
	
	function setActivePieces() {
		var active = chessBoard.activecolour;
		$('.piece').draggable('disable');
		$('.piece.colour_' + active).draggable('enable');
	}
	
	setActivePieces();
}

$(document).ready(function() {
	new jQueryChessBoard('chessBoard');
});
