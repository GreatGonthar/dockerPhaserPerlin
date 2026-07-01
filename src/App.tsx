import { useEffect, useRef, useState } from "react";
import { initGame } from "./game/gameConfig";
import { Joystick } from "./components/Joystick";
import { EventBridge } from "./game/EventBridge";


function App() {
	const [position, setPosition] = useState({ x: 0, y: 0, seed: 0 });
	const gameRef = useRef<Phaser.Game | null>(null);

	useEffect(() => {
		if (!gameRef.current) {
			gameRef.current = initGame("game-container");
		}
		return () => {
			gameRef.current?.destroy(true);
			gameRef.current = null;
		};
	}, []);
	useEffect(() => {
		EventBridge.on("player-position", (pos: { x: number; y: number; seed: number }) => {
			setPosition(pos);
		});

		return () => {
			EventBridge.off("player-position");
		};
	}, []);

	return (
		<div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
			<div id="game-container" style={{ width: "100%", height: "100%" }} />
			<Joystick />
			<div style={{ position: "absolute", top: 20, left: 20, color: "white" }}>
				<h3>
					X: {position.x} / Y: {position.y}, SEED: {position.seed}
				</h3>
			</div>
		</div>
	);
}

export default App;
