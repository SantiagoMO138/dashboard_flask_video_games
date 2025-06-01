from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from sqlalchemy.orm import sessionmaker
from models.base import engine
from models.model import Usuario, VideoGameSale
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_fallback")

# Crear fábrica de sesiones SQLAlchemy
Session = sessionmaker(bind=engine)

# Setup de LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth'


@login_manager.user_loader
def load_user(user_id):
    with Session() as db_session:
        # Usar Session.get para SQLAlchemy 2.0
        return db_session.get(Usuario, int(user_id))


@app.route('/')
def home():
    return render_template('auth.html', is_admin=current_user.role == 'admin' if current_user.is_authenticated else False)


@app.route('/auth', methods=['GET', 'POST'])
def auth():
    with Session() as db_session:
        if request.method == 'POST':
            action = request.form['action']
            if action == 'login':
                username = request.form['username']
                password = request.form['password']
                user = db_session.query(Usuario).filter(
                    Usuario.username == username).first()
                if user and user.check_password(password):
                    login_user(user)
                    flash('Sesión iniciada exitosamente', 'success')
                    return redirect(url_for('dashboard'))
                else:
                    flash('Usuario o contraseña incorrectos', 'danger')
                    return redirect(url_for('auth'))
        return render_template('auth.html', is_admin=current_user.role == 'admin' if current_user.is_authenticated else False)


@app.route('/dashboard', methods=['GET', 'POST'])
@login_required
def dashboard():
    with Session() as db_session:
        if request.method == 'POST':
            action = request.form['action']
            if action == 'register':
                if current_user.role != 'admin':
                    flash(
                        'Solo los administradores pueden registrar nuevos usuarios', 'danger')
                    return redirect(url_for('dashboard'))
                username = request.form['username']
                password = request.form['password']
                role = request.form.get('role', 'user')  # Por defecto, 'user'
                if db_session.query(Usuario).filter(Usuario.username == username).first():
                    flash('El usuario ya existe', 'danger')
                else:
                    new_user = Usuario(
                        username=username,
                        password=generate_password_hash(password),
                        role=role
                    )
                    db_session.add(new_user)
                    db_session.commit()
                    flash('Usuario creado exitosamente', 'success')
                return redirect(url_for('dashboard'))
        return render_template('dashboard.html', username=current_user.username, is_admin=current_user.role == 'admin')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth'))


@app.route('/api/video_games')
def api_video_games():
    with Session() as db_session:
        video_games = db_session.query(VideoGameSale).all()
        juegos = []
        for juego in video_games:
            juegos.append({
                "Name": juego.name,
                "Platform": juego.platform,
                "Year": juego.year,
                "Genre": juego.genre,
                "Publisher": juego.publisher,
                "NA_Sales": juego.na_sales,
                "EU_Sales": juego.eu_sales,
                "JP_Sales": juego.jp_sales,
                "Other_Sales": juego.other_sales,
                "Global_Sales": juego.global_sales
            })
        return jsonify(juegos)


@app.route('/api/filtros', methods=['GET'])
def obtener_filtros():
    with Session() as db_session:
        plataforma = request.args.getlist('plataforma')
        genero = request.args.getlist('genero')
        anio = request.args.getlist('anio')
        editor = request.args.getlist('editor')
        query = db_session.query(VideoGameSale)
        if plataforma:
            query = query.filter(VideoGameSale.platform.in_(plataforma))
        if genero:
            query = query.filter(VideoGameSale.genre.in_(genero))
        if anio:
            query = query.filter(VideoGameSale.year.in_(anio))
        if editor:
            query = query.filter(VideoGameSale.publisher.in_(editor))
        data = query.all()
        plataformas = sorted({v.platform for v in data if v.platform})
        generos = sorted({v.genre for v in data if v.genre})
        anios = sorted({v.year for v in data if v.year})
        editores = sorted({v.publisher for v in data if v.publisher})
        return jsonify({
            'plataformas': plataformas,
            'generos': generos,
            'anios': anios,
            'editores': editores
        })


@app.route('/listgames')
@login_required
def listgames():
    if current_user.role != 'admin':
        flash('Solo los administradores pueden acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    # Usar el archivo correcto 'crud/list.html'
    return render_template('crud/list.html')


@app.route('/api/list_video_games')
@login_required
def list_video_games():
    if current_user.role != 'admin':
        return jsonify({"error": "Solo los administradores pueden acceder a esta API"}), 403
    with Session() as db_session:
        data = db_session.query(VideoGameSale).all()
        games = []
        for game in data:
            games.append({
                "id": game.id,
                "Name": game.name,
                "Platform": game.platform,
                "Year": game.year,
                "Genre": game.genre,
                "Publisher": game.publisher,
                "NA_Sales": game.na_sales,
                "EU_Sales": game.eu_sales,
                "JP_Sales": game.jp_sales,
                "Other_Sales": game.other_sales,
                "Global_Sales": game.global_sales
            })
        return jsonify(games)


@app.route('/api/opciones', methods=['GET'])
def obtener_opciones():
    with Session() as db_session:
        plataformas = db_session.query(VideoGameSale.platform).distinct().all()
        generos = db_session.query(VideoGameSale.genre).distinct().all()
        editores = db_session.query(VideoGameSale.publisher).distinct().all()
        anios = db_session.query(VideoGameSale.year).distinct().all()
        return jsonify({
            "plataformas": sorted([p[0] for p in plataformas if p[0]]),
            "generos": sorted([g[0] for g in generos if g[0]]),
            "editores": sorted([e[0] for e in editores if e[0]]),
            "anios": sorted([a[0] for a in anios if a[0]])
        })


@app.route('/add/video_games', methods=['POST'])
@login_required
def crear_videojuego():
    if current_user.role != 'admin':
        return jsonify({"error": "Solo los administradores pueden realizar esta acción"}), 403
    with Session() as db_session:
        data = request.json
        nuevo = VideoGameSale(
            rank=int(data.get('rank')),
            name=data.get('name'),
            platform=data.get('platform'),
            year=int(data.get('year')) if data.get('year') else None,
            genre=data.get('genre'),
            publisher=data.get('publisher'),
            na_sales=float(data.get('na_sales')),
            eu_sales=float(data.get('eu_sales')),
            jp_sales=float(data.get('jp_sales')),
            other_sales=float(data.get('other_sales')),
            global_sales=float(data.get('global_sales'))
        )
        db_session.add(nuevo)
        db_session.commit()
        return jsonify({"mensaje": "Videojuego agregado correctamente"})


@app.route('/del/video_games/<int:id>', methods=['DELETE'])
@login_required
def eliminar_videojuego(id):
    if current_user.role != 'admin':
        return jsonify({"error": "Solo los administradores pueden realizar esta acción"}), 403
    with Session() as db_session:
        videojuego = db_session.get(VideoGameSale, id)
        if videojuego:
            db_session.delete(videojuego)
            db_session.commit()
            return jsonify({"mensaje": "Eliminado correctamente"})
        return jsonify({"error": "Videojuego no encontrado"}), 404


@app.route('/upd/video_games/<int:id>', methods=['PUT'])
@login_required
def actualizar_videojuego(id):
    if current_user.role != 'admin':
        return jsonify({"error": "Solo los administradores pueden realizar esta acción"}), 403
    with Session() as db_session:
        juego = db_session.get(VideoGameSale, id)
        if not juego:
            return jsonify({"error": "No encontrado"}), 404
        data = request.json
        juego.rank = int(data.get("rank"))
        juego.name = data.get("name")
        juego.platform = data.get("platform")
        juego.year = int(data.get("year")) if data.get("year") else None
        juego.genre = data.get("genre")
        juego.publisher = data.get("publisher")
        juego.na_sales = float(data.get("na_sales"))
        juego.eu_sales = float(data.get("eu_sales"))
        juego.jp_sales = float(data.get("jp_sales"))
        juego.other_sales = float(data.get("other_sales"))
        juego.global_sales = float(data.get("global_sales"))
        db_session.commit()
        return jsonify({"mensaje": "Actualizado correctamente"})


@app.teardown_appcontext
def shutdown_session(exception=None):
    # No cerrar la sesión global aquí, ya que usamos sesiones por solicitud
    pass


if __name__ == '__main__':
    app.run(debug=True)
