import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "SUA_API", projectId: "SEU_ID" }; // Preencha com seus dados
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentGroup = 'Peito';
let xp = parseInt(localStorage.getItem('gym_xp')) || 0;

// Funções globais
window.openModal = () => document.getElementById('modal').style.display = 'flex';
window.closeModal = () => document.getElementById('modal').style.display = 'none';

window.filter = (group, btn) => {
    currentGroup = group;
    document.querySelectorAll('.group-selector button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
};

window.saveEx = async () => {
    const data = {
        name: document.getElementById('ex-name').value,
        series: document.getElementById('ex-series').value,
        reps: document.getElementById('ex-reps').value,
        weight: document.getElementById('ex-weight').value,
        rest: document.getElementById('ex-rest').value,
        group: document.getElementById('ex-group').value
    };
    await addDoc(collection(db, "planilha_treino"), data);
    closeModal();
};

window.completeSet = (id, restTime) => {
    // Evolução de Carga (Func. 01)
    xp += 25;
    localStorage.setItem('gym_xp', xp);
    updateXP();
    
    // Inicia Cronômetro da Planilha
    startTimer(restTime);
    if(navigator.vibrate) navigator.vibrate(100);
};

function startTimer(durationStr) {
    // Converte "1:45" em segundos
    const parts = durationStr.split(':');
    let seconds = parts.length > 1 ? (parseInt(parts[0]) * 60 + parseInt(parts[1])) : parseInt(parts[0]);
    
    const clock = document.getElementById('timer-clock');
    const interval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        clock.innerText = `${m}:${s.toString().padStart(2, '0')}`;
        
        if(seconds <= 0) {
            clearInterval(interval);
            clock.innerText = "VAI!";
            if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
    }, 1000);
}

function updateXP() {
    document.getElementById('lvl-display').innerText = `LVL ${Math.floor(xp/100) + 1}`;
    document.getElementById('xp-fill').style.width = `${xp % 100}%`;
}

function render() {
    const q = query(collection(db, "planilha_treino"), where("group", "==", currentGroup));
    onSnapshot(q, (snap) => {
        const list = document.getElementById('exercise-list');
        list.innerHTML = '';
        snap.forEach(d => {
            const ex = d.data();
            list.innerHTML += `
                <div class="exercise-card">
                    <h3>${ex.name}</h3>
                    <div class="card-info">
                        <div class="info-box"><small>Séries</small><span>${ex.series}</span></div>
                        <div class="info-box"><small>Reps</small><span>${ex.reps}</span></div>
                        <div class="info-box"><small>Carga</small><span>${ex.weight}</span></div>
                        <div class="info-box"><small>Descanso</small><span>${ex.rest}</span></div>
                    </div>
                    <button class="btn-complete" onclick="completeSet('${d.id}', '${ex.rest}')">CONCLUIR SÉRIE</button>
                </div>`;
        });
    });
}

updateXP();
render();


// Exemplo de como ficaria a lógica visual no script.js
function renderCard(ex) {
    return `
        <div class="exercise-card">
            <h3>${ex.name}</h3>
            <div class="sets-tracker">
                ${Array(parseInt(ex.series)).fill().map((_, i) => `
                    <div class="set-dot" onclick="markSet(this, '${ex.rest}')">${i+1}</div>
                `).join('')}
            </div>
            <div class="card-details">
                <span>Carga: ${ex.weight}</span>
                <span>Reps: ${ex.reps}</span>
            </div>
        </div>
    `;
}
