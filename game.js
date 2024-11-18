/**
 * Postavljanje Canvas objekta te konteksta crtanja ctx. Veličina Canvasa treba pokrivati cijelu veličinu prozora u pregledniku, pa su širini i visini
 * pridijeljena svojstva window.innerWidth i innerHeight.
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const hitBrickSound = new Audio("sounds/jeej.wav");
const hitBatOrWallSound = new Audio("sounds/boink.wav");
const gameOverSound = new Audio("sounds/aaww.wav");


const styles = getComputedStyle(document.documentElement);     //stilovi iz css datoteke

/**
 * Objekt koji predstavlja lopticu, startna pozicija loptice je na sredini ekrana po širini i po visini malo iznad palice, taman na njenom vrhu.
 * Radijus loptice, kao i njezina boja, izvučeni su iz styles.css. 
 * dx predstavlja početnu horizontalnu brzinu i smjer. Koristi se Math.random() za "randomizaciju" kuta po kojim će se loptica početi kretati te se broj
 * dobiven pomoću (Math.random() * 2 - 1) množi s 4 kao umjerenom brzinom. 
 * dy predstavlja početnu vertikalnu brzinu loptice i vrijednost je -4 jer je 4 umjerena brzina, a vrijednost je negativna jer na objektu Canvas koordinata
 * y raste prema dnu ekrana, a loptica se mora odbiti prema gore na početku igrice.
 */
const ball = {
  x: canvas.width / 2,
  y: canvas.height - 40,
  radius: parseInt(styles.getPropertyValue("--ball-radius")),
  dx: (Math.random() * 2 - 1) * 4,
  dy: -4,
  color: styles.getPropertyValue("--ball-color").trim(),
};

/**
 * Objekt koji predstavlja palicu na dnu ekrana. Širina, visina i boja se uzimaju iz styles.css, kao i početni položaj, koji ovisi o dimenzijama palice i 
 * treba na početku igre biti na sredini ekrana. 
 * Dx je brzina u smjeru horizontalne osi, ne postoji kretanje u smjeru vertikalne.
 */

const bat = {
  width: parseInt(styles.getPropertyValue("--bat-width")),
  height: parseInt(styles.getPropertyValue("--bat-height")),
  x: canvas.width / 2 - parseInt(styles.getPropertyValue("--bat-width")) / 2,
  y: canvas.height - parseInt(styles.getPropertyValue("--bat-height")),
  color: styles.getPropertyValue("--bat-color").trim(),
  dx: 8,
};

/**
 * Podaci o ciglama (blokovima koji se razbijaju, u nastavku samo cigle). 
 * Uzimaju se svojstva iz styles.css, dodaje se padding da ne bi bile skupljene i komplicirane za prebrojati i razlikovati. 
 * Ukupno je 30 cigli, po 10 u 3 reda.
 */
const brickPadding = parseInt(styles.getPropertyValue("--brick-padding"));
const brickHeight = parseInt(styles.getPropertyValue("--brick-height"));
const rows = 3;
const cols = 10;
const brickWidth = canvas.width / cols - brickPadding;

/**
 * Sljedeći podaci su oni koji prate stanje igre, to je dvodimenzionalno polje s ciglama, trenutni rezultat, najbolji rezultat pohranjen u Web API Local
 * Storage-u te logička varijabla gameOver.
 */

let bricks = [];
let score = 0;
let highscore = localStorage.getItem("highscore") || 0;
let gameOver = false;

/**
 * Funkcija za smještanje cigli u dvodimanzionalno polje. Spremaju se objekti "vrste cigla", ajmo tako reć, koriste se podaci o ciglama definirani prije.
 */
function setupBricks() {
  bricks = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      bricks.push({
        x: col * (brickWidth + brickPadding) + brickPadding / 2,
        y: row * (brickHeight + brickPadding) + 30,
        status: true,
      });
    }
  }
}

/**
 * Funkcija za crtanje cigli po ekranu pomoću dvodimenzionalnog polja bricks. Svakoj cigli dodaje se sjenčanje "debljine" 7 i bijele boje radi kontrasta,
 * jer je pozadina igrice crne boje. 
 */
function drawBricks() {
  ctx.fillStyle = styles.getPropertyValue("--brick-color").trim();
  bricks.forEach((brick) => {
    if (brick.status) {
      ctx.shadowColor = "white";
      ctx.shadowBlur = 7;
      ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
      ctx.strokeRect(brick.x, brick.y, brickWidth, brickHeight);
    }
  });
}

/**
 * Funkcija za crtanje loptice. Funkcija ctx.beginPath() započinje liniju za crtanje na Canvasu. Sve funkcije izvršene na ctx objektu nakon beginPath odnose
 * se na tu novu liniju. Funkcija ctx.arc() crta kružni luk, brid kruga. Njoj se šalju x i y koordinate središta kruga, polumjer kruga, početni kut u radijanima 
 * i završni kut, također u radijanima (2pi - puna kružnica). Funkcijom fillStyle kružnica se ispuni bojom loptice koja je predefinirana. 
 * Loptici sam također dodala sjenčanje radi boljeg kontrasta.  
 * Pomoću fill funkcije krug se ispunjava, a pomoću closePath se završava rad na trenutnoj liniji koja je ocrtala lopticu. 
 */

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.shadowColor = "white";
  ctx.shadowBlur = 7;
  ctx.fill();
  ctx.closePath();
}

/**
 * Funkcija za crtanje palice na dnu ekrana. Novom objektu se dodjeljuju predefinirana boja palice te sjenčanje u bijeloj boji radi kontrasta. 
 * Funkcijom fillRect ispunjava se pravokutnik sa svojstvima x i y koordinate središta pravokutnika te njegovom širinom i dužinom.
 */

function drawBat() {
  ctx.fillStyle = bat.color;
  ctx.shadowColor = "white";
  ctx.shadowBlur = 7;
  ctx.fillRect(bat.x, bat.y, bat.width, bat.height);
}

/**
 * Funkcija za prikaz trenutnog rezultata i najboljeg rezultata koji se čuvaju u HTML5 Web Storage API-ju. Tekstu se pridjeljuju font i boja. Funkcija 
 * fillText ispisuje tekst u zadanom formatu, u gornjem desnom kutu Canvasa.
 */

function drawScore() {
  ctx.shadowColor = "transparent";
  ctx.font = "20px Arial";
  ctx.fillStyle = styles.getPropertyValue("--score-color").trim();
  ctx.fillText(`Score: ${score} Highscore: ${highscore}`, canvas.width - 200, 30);
}

/**
 * Funkcija za ispisivanje teksta za kraj igre. Taj tekst može biti ili crveni "GAME OVER" ili zeleni "WIN", ovisno o krajnjem rezultatu igrača. 
 * Dodjeljuje se font i boja, a pomoću fillText funkcije poruka se ispisuje na sredini ekrana.
 */

function drawMessage(text, color) {
    ctx.shadowColor = "transparent";
    ctx.font = styles.getPropertyValue("--message-font-size").trim() + " Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

/**
 * Funkcija koja kontrolira kretanje loptice. Pozicija loptice se ažurira u odnosu na njezinu trenutačnu brzinu. Vrijednost ball.dx predstavlja pomak
 * loptice po x osi, pozitivna vrijednost označava kretanje prema desno, a negativna prema lijevo. Vrijednost ball.dy predstavlja pomak loptice po y osi,
 * pozitivna vrijednost označava kretanje prema dolje, a negativna prema gore.
 */

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    /**
     * Situacija kad se događa sudar sa zidovima. U tom slučaju je zadovoljen uvjet da je vodoravna pozicija loptice + njezin radijus veća od širine ekrana
     * (ako loptica udari u desni zid) ili da je vodoravna pozicija loptice - njezin radijus manja od 0 (u slučaju da udari u lijevi zid, vrijednosti x osi
     * idu od 0 s lijeva na desno). 
     * Drugi if ispod se odnosi na situaciju kad loptica udari u strop, tj. dođe do početka y osi i vertikalna pozicija - radijus je manji od 0.
     * U obje ove situacije se loptica nastavi kretati jednakom brzinom, ali po drugim kutem, zrcalnim od onoga pod kojim je udarila u zid. U jednoj situaciji
     * se onda ažurira pomak po x osi ball.dy * -1, a u drugoj pomak po y osi. U obje situacije se upali zvuk koji sam dodala, "boink".
     */
  
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
        hitBatOrWallSound.currentTime = 0;
        hitBatOrWallSound.play();
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
        hitBatOrWallSound.currentTime = 0;
        hitBatOrWallSound.play();
    }

    /**
     * Situacija koja opisuje udaranje loptice u palicu na dnu ekrana. Ispituje se je li donji rub loptice na visini palice pomoću uvjeta ball.y + ball.radius > bat.y.
     * Također se pomoću uvjeta ball.x > bat.x && ball.x < bat.x + bat.width ispituje je li loptica horizontalno unutar širine palice. U tom slučaju, ažurira
     * se pomak po osi y (ball.dy *= -1) jer se loptica nastavi kretati prema gore nakon odbijanja, te se upali zvuk "boink".
     */
    if (ball.y + ball.radius > bat.y && ball.x > bat.x && ball.x < bat.x + bat.width) {
        ball.dy *= -1;

        hitBatOrWallSound.currentTime = 0;
        hitBatOrWallSound.play();
    }

    /**
     * Sljedeća situacija opisuje sudar loptice s ciglama. Iterira se kroz polje cigli bricks te se sudar provjerava jedino ako trenutna cigla još uvijek
     * postoji na svom mjestu, tj. nije već poništena. Zatim se za svaku ciglu provjerava je li loptica unutar širine cigle te je li unutar njezine visine.
     * Ako je to točno, što znači da loptica dodiruje ciglu, u tom slučaju promijeni se dy za lopticu, ažurira se status cigle na false (više ne postoji), 
     * varijabla koja čuva trenutni rezultat se poveća za 1, zasvira zvuk "jupi" te, u slučaju da je trenutni rezultat veći od najboljeg, najbolji se ažurira
     * na njega.
     */
  bricks.forEach((brick) => {
    if (brick.status) {
        if (
            ball.x > brick.x &&
            ball.x < brick.x + brickWidth &&
            ball.y - ball.radius < brick.y + brickHeight &&
            ball.y + ball.radius > brick.y
        ) {
            ball.dy *= -1;
            brick.status = false;
            score++;
            hitBrickSound.currentTime = 0;
            hitBrickSound.play();
            if (score > highscore) {
                highscore = score;
                localStorage.setItem("highscore", highscore);
            }
        }
    }
});

  /**
   * Provjerava se je li loptica dotaknula dno ekrana, ako joj zbroj y koordinate i radijusa veći od visine ekrana. U tom slučaju, varijabla gameOver se postavi
   * u true te svira zvuk koji označava kraj. 
   */
  if (ball.y + ball.radius > canvas.height) {
    gameOver = true;
    gameOverSound.play();
  }
}

/**
 * Funkcija koja opisuje kretanje palice. Palica se može kretati lijevo i desno (po x osi, naravno) i kontrolira ju igrač pomoću znakova < i > na tipkovnici.
 */
function moveBat(e) {
  if (e.key === "ArrowLeft" && bat.x > 0) {
    bat.x -= bat.dx;
  }
  if (e.key === "ArrowRight" && bat.x + bat.width < canvas.width) {
    bat.x += bat.dx;
  }
}

/**
 * Funkcija kojom se započinje igra i koja poziva sve ostale funkcije da se kontinuirano izvršavaju dok se ne dosegne kraj igre. U slučaju da je kraj igre, 
 * pozvat će se funkcija drawMessage za gubitak ili pobjedu, ovisno o varijabli gameOver ili score. Igra počinje s praznim Canvasom na kojemu se nacrtaju
 * cigle, loptica, palica, rezultat i loptica se počinje kretati. 
 */
function draw() {
  if (gameOver) {
    drawMessage("GAME OVER", styles.getPropertyValue("--game-over-color").trim());
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawBat();
  drawScore();
  moveBall();

  if (score === rows * cols) {
    drawMessage("WIN", styles.getPropertyValue("--win-color").trim());
    return;
  }

  requestAnimationFrame(draw);
}
/**
 * Postavi se eventListener koji sluša input od tipkovnice i poziva funkciju moveBat.
 * Cigle se generiraju i poziva se funkcija draw.
 */

document.addEventListener("keydown", moveBat);
setupBricks();
draw();