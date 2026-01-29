from flask import Flask, send_file, make_response, jsonify
from flask_cors import CORS
import sqlite3
import io

app = Flask(__name__)
CORS(app)

@app.route('/tiles/<mbtiles_file>/<int:z>/<int:x>/<int:y>.mvt')
def get_tile(mbtiles_file, z, x, y):
    # 计算 y 的瓦片索引（TMS 到 XYZ 的转换）
    y_xyz = (1 << z) - y - 1
    
    try:
        # 连接到 MBTiles 数据库
        conn = sqlite3.connect(f'D:\LTGK-PROJECT\MyGithub\map-examples\public\data/{mbtiles_file}')
        cursor = conn.cursor()
        
        # 查询瓦片数据
        cursor.execute('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?', (z, x, y_xyz))
        row = cursor.fetchone()
        
        if row:
            # 返回瓦片数据
            tile_data = row[0]
            response = make_response(tile_data)
            response.headers['Content-Type'] = 'application/x-protobuf'
            response.headers['Content-Encoding'] = 'gzip'
            return response
        else:
            # 返回 404 如果瓦片不存在
            return 'Tile not found', 404
            
    except Exception as e:
        print(f'Error: {e}')
        return 'Internal server error', 500
    finally:
        if conn:
            conn.close()

@app.route('/debug/<mbtiles_file>')
def debug_mbtiles(mbtiles_file):
    try:
        # 连接到 MBTiles 数据库
        conn = sqlite3.connect(f'./{mbtiles_file}')
        cursor = conn.cursor()
        
        # 获取所有表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        
        # 获取元数据
        metadata = {}
        if 'metadata' in tables:
            cursor.execute("SELECT name, value FROM metadata;")
            for row in cursor.fetchall():
                metadata[row[0]] = row[1]
        
        # 获取图层信息
        layers = []
        if 'tiles' in tables:
            # 尝试获取唯一的图层名称
            cursor.execute("SELECT DISTINCT layer_name FROM tiles LIMIT 10;")
            layer_rows = cursor.fetchall()
            layers = [row[0] for row in layer_rows if row[0]]
        
        conn.close()
        
        return jsonify({
            'tables': tables,
            'metadata': metadata,
            'layers': layers
        })
        
    except Exception as e:
        print(f'Debug error: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)