class Visualize extends THREE.Object3D{

	private RINGCOUNT = 160;//リングの数
	private SEPARATION = 30;
	private INIT_RADIUS = 50;
	private SEGMENTS = 512; //リングの分割数
	private BIN_COUNT = 512;

	private cube;
	private loopGeom;
	private material;

	constructor(){
		super();
		this.init();
	}

	private init(){

		//cube追加
		var geometry = new THREE.BoxGeometry(40, 40, 40);
		this.material = new THREE.MeshPhongMaterial({color: 0xff0000});
		this.cube = new THREE.Mesh(geometry, this.material);
		this.cube.position.set(0, 0, 0);
		this.cube.castShadow = true;
		this.add(this.cube);

		//shape test circle
		var loopShape = new THREE.Shape();
		var r = 100

		loopShape.absarc(0, 0, 100, 0, Math.PI * 2, false);//これで円を書いている absarc(原点x,原点y,半径,start角度,end角度,???)
		this.loopGeom = loopShape.createPointsGeometry(512 / 2);//shapeにgeometoryの頂点データを生成する  //2点生成されるから半分の数の指定でいい？
		this.loopGeom.dynamic = true;

		//頂点をLineで結ぶ
		var m = new THREE.LineBasicMaterial({
			color: 0xffffff,
			linewidth: 1,
			opacity: 0.7,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});
		var line = new THREE.Line(this.loopGeom, m);

		var scale = 1;
		scale *= 0.5;
		line.scale.x = scale;
		line.scale.y = scale;
		this.add(line);

		//z-index
		for (var j = 0; j < this.SEGMENTS; j++) {
			var v:any = this.loopGeom.vertices[j]
			this.loopGeom.vertices[j].z = 0;
		}
		// link up last segment
		this.loopGeom.vertices[this.SEGMENTS].z = this.loopGeom.vertices[0].z;

	}

	public update(){


	}
}