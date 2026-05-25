
import { useRef } from "react";
import { EventBridge } from "../game/EventBridge";

export const Joystick = () => {
	const startPos = useRef({ x: 0, y: 0 });
	const active = useRef(false);

	const handleStart = (x: number, y: number) => {
		active.current = true;
		startPos.current = { x, y };
	};

	const handleMove = (x: number, y: number) => {
		if (!active.current) return;

		const dx = x - startPos.current.x;
		const dy = y - startPos.current.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < 10) return; // мёртвая зона

		// Определяем направление
		const angle = Math.atan2(dy, dx); // угол в радианах
		EventBridge.emit("joystick-move", { dx, dy, angle });
	};

	const handleEnd = () => {
		active.current = false;
		EventBridge.emit("joystick-stop");
	};

	return (
		<div
			style={{
				position: "absolute",
				bottom: 100,
				left: "50%", // от левого края 50%
				transform: "translateX(-50%)", // смещение на половину своей ширины
				width: 220,
				height: 220,
				borderRadius: "50%",
				background: "rgba(255,255,255,0.15)",
				border: "2px solid rgba(255,255,255,0.3)",
				touchAction: "none",
			}}
			onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
			onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
			onTouchEnd={handleEnd}
			onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
			onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
			onMouseUp={handleEnd}
		/>
	);
};
