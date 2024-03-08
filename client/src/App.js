import React, { useEffect, useState } from 'react'
import "./App.css"
import Square from './Square/Square';
import { io } from 'socket.io-client';
import Swal from "sweetalert2";

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

const App = () => {


  const [gameState, setGameState] = useState(renderFrom);

  const [currentPlayer, setCurrentPlayer] = useState('circle');

  const [finishedState, setFinishedState] = useState(false);

  const [changeColorState, setChangeColorState] = useState([]);

  const [playingOnline, setPlayingOnline] = useState(false);

  const [socket, setSocket] = useState(null);

  const [playerName, setPlayerName] = useState('');

  const [opponentName, setOpponentName] = useState(null);

  const [playingAs, setPlayingAs] = useState(null);

  const checkWinner = () => {
    // Check rows
    for (let row = 0; row < gameState.length; row++) {
      if (gameState[row][0] === gameState[row][1] && gameState[row][1] === gameState[row][2]) {
        setChangeColorState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }

    // Check columns
    for (let col = 0; col < gameState.length; col++) {
      if (gameState[0][col] === gameState[1][col] && gameState[1][col] === gameState[2][col]) {
        setChangeColorState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }

    // Check main diagonal
    if (gameState[0][0] === gameState[1][1] && gameState[1][1] === gameState[2][2]) {
      setChangeColorState([0, 4, 8]);
      return gameState[0][0];
    }

    // Check anti-diagonal
    if (gameState[0][2] === gameState[1][1] && gameState[1][1] === gameState[2][0]) {
      setChangeColorState([2, 4, 6]);
      return gameState[0][2];
    }

    const isDraw = gameState.flat().every((e) => {
      if (e === "circle" || e === "cross") return true;
    })

    if (isDraw) return 'Draw';

    // No winner
    return null;
  }


  useEffect(() => {

    const winner = checkWinner();

    if (winner) {
      setFinishedState(winner);
    }
  }, [gameState])

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your Name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      }
    });
    return result;
  }

  socket?.on("opponentLeftMatch", () => {
    setFinishedState("opponentLeftMatch");
  })


  socket?.on("playerMoveFromServer", (data) => {
    // setCurrentPlayer(data.state.currentPlayer);
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign;
      return newState
    })
    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  });

  socket?.on('connect', function () {
    setPlayingOnline(true);
  });


  socket?.on('OpponentNotFound', function () {
    setOpponentName(false);
  });

  socket?.on('OpponentFound', function (data) {
    setPlayingAs(data.playingAs);
    setOpponentName(data.opponentName);
  });




  async function playingOnlineClick() {
    const result = await takePlayerName();

    if (!result.isConfirmed) {
      return;
    }

    const username = result.value;
    setPlayerName(username);

    const newSocket = io("http://localhost:3002/", {
      autoConnect: true
    });
    newSocket?.emit("request_to_play", {
      playerName: username,
    })

    setSocket(newSocket);
  }

  if (!playingOnline) {
    return <div className='main-div'>
      <button onClick={playingOnlineClick} className='playOnline'>Play Online</button>
    </div>
  }

  if (playingOnline && !opponentName) {
    return <div className='wait-opponent'> <p>Waiting For Opponent...</p></div >
  }

  return (
    <div className="main-div">
      <div className="move-detection">
        <div className={`left ${currentPlayer === playingAs ? 'current-move-' + currentPlayer : ''}`}>{playerName}</div>
        <div className={`right ${currentPlayer !== playingAs ? 'current-move-' + currentPlayer : ''}`}>{opponentName}</div>
      </div>
      <div>
        <h1 className='game-heading title'>Tic Tac Toe</h1>
        <div className='square-wrapper'>
          {
            gameState.map((arr, rowIndex) =>
              arr.map((e, colIndex) => {
                return <Square
                  gameState={gameState}
                  socket={socket}
                  changeColorState={changeColorState}
                  finishedState={finishedState}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  setGameState={setGameState}
                  id={rowIndex * 3 + colIndex}
                  key={rowIndex * 3 + colIndex}
                  currentElement={e}
                  playingAs={playingAs}
                />
              }))
          }

        </div>

        {finishedState && finishedState !== 'opponentLeftMatch' && finishedState !== 'Draw' &&
          (<h3 className='finished-state'>{finishedState === playingAs ? "You" : finishedState} won the Game</h3>)}

        {finishedState && finishedState !== 'opponentLeftMatch' && finishedState === 'Draw' &&
          (<h3 className='finished-state'>It's a Draw</h3>)}






      </div>
      {
        !finishedState && opponentName &&
        (<h3>You are playing against {opponentName}</h3>)


      }

      {
        finishedState && finishedState === 'opponentLeftMatch' &&
        (<h3>You Won, Opponent Left the Match</h3>)


      }

    </div >
  )
}

export default App