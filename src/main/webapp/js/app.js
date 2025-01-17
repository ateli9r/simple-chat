import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

// Firebase 접속 설정
const firebaseConfig = {
	apiKey: "...",
	authDomain: "simple-chat-b9a82.firebaseapp.com",
	databaseURL: "https://simple-chat-b9a82-default-rtdb.firebaseio.com",
	projectId: "simple-chat-b9a82",
	storageBucket: "simple-chat-b9a82.firebasestorage.app",
	messagingSenderId: "943796905544",
	appId: "1:943796905544:web:65ba710d883cfe6c939a7d",
	measurementId: "G-X1XD8YJY31"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);


// 채팅 앱
const chat_app = {
	// 초기화
	init: (is_prod) => {
		// 
		chat_app.is_prod = is_prod;
		// chat_app.callback = callback;
		
		// 채팅 앱 버퍼 초기화
		chat_app.messages = [];
		chat_app.buffer = [];
		
		// Firebase handler 초기화
		if (is_prod) {
			chat_app.app = initializeApp(firebaseConfig);
		} else {
			chat_app.app = null;
		}
	},
	// 수신 이벤트 초기화
	init_reader: (callback) => {
		if (!chat_app.app) return;
		if (!callback) return;
		
		const db = getDatabase(app);
		
		onValue(ref(db, "msgs"), (snapshot) => {
			callback(snapshot);
		});
	},
	// 메시지 전송
	send_msg: (timestamp, msg) => {
		const data = {timestamp: timestamp, msg: msg};
		chat_app.buffer.push(data);
	},
	// 메시지 불러오기
	load_messages: () => {
		return chat_app.messages;
	},
	// 버퍼 불러오기
	load_buffer: () => {
		return chat_app.buffer;
	},
	// 버퍼에 있는 메시지 보내기
	apply_msg: () => {
		const db = (chat_app.is_prod) ? getDatabase(app) : null;
		
		let buffer = chat_app.buffer;
		let initial_size = buffer.length;
		
		for (let i = 0; i < initial_size; i++) {
			const item = buffer[0];
			buffer = buffer.splice(1);
			
			if (chat_app.is_prod) {
				set(ref(db, "msgs/"+item.timestamp), item.msg);
			} else {
				chat_app.messages.push(item);
			}
		}
		
		chat_app.buffer = buffer;
	},
};

// 채팅 앱 테스트
const test_chat_app = {
	test: () => {
		let check = 0;
		
		// 채팅 앱 초기화 (for Test)
		chat_app.init(false);
		check += chat_app.load_buffer().length == 0;
		
		// 메시지를 10번 보내면 버퍼에 10개가 쌓인다
		for (let i = 0; i < 10; i++) {
			chat_app.send_msg(new Date().getTime(), "test msg"+(i+1));
		}
		check += chat_app.load_buffer().length == 10;
		
		// 메시지를 보내지 않았다면 메시지 목록은 비어있음
		check += chat_app.load_messages().length == 0;
		
		// 메시지 보내기 이후 버퍼 비우기
		chat_app.apply_msg();
		check += chat_app.load_buffer().length == 0;
		
		// 버퍼를 비운 이후 메시지 업데이트
		check += chat_app.load_messages().length > 0;
		
		return check == 5;
	},
};

$(document).ready(() => {
	// 채팅 앱 테스트
	if (!test_chat_app.test()) {
		alert("채팅 앱 초기화중 에러가 발생했습니다.");
		return;	
	}
	
	// 채팅 앱 초기화 (for Production)
	chat_app.init(true);
	
	// 수신 이벤트 초기화
	chat_app.init_reader((snapshot) => {
		$("#chatlist").empty();

		snapshot.forEach((child) => {
			const html = "<div>"+child.val()+"</div>";
			$("#chatlist").append(html);
		});

		$("#chatlist").scrollTop(15000);
	});
	
	// 채팅 내용 보내기
	$("#send_button").on("click", () => {
		const date = new Date();
		const msg = $("#message").val();
		
		chat_app.send_msg(date.getTime(), msg);
		chat_app.apply_msg();
		
		$("#message").val("");
		$("#message").focus();
	});
});
