var phys = {};
//spec: {x: number, y: number}
phys.Vector2 = function(x, y) {    
    this.x = x;
    this.y = y;
};
phys.Vector2.prototype = {
    constructor: phys.Vector2,
    distanceTo: function(v) {
        var dx, dy;
        dx = this.x - p.x;
        dy = this.y - p.y;
        return Math.sqrt(dx*dx+dy*dy);
    },
    dot:function(v) {
        return v.x*this.x + v.y+this.y;
    },
    rotate:function(rot, p) {
        var offset;
        p = p || new phys.Vector2(0, 0);
        offset = new phys.Vector2(this.x - p.x, this.y - p.y);
        offset = rot.multiply(offset);
        offset.x += p.x;offset.y += p.y;
        return offset;
    },
    addSelf:function(v) {
        this.x += v.x;
        this.y += v.y;
    },
    add:function(v) {
        return new phys.Vector2(v.x+this.x, v.y+this.y);
    },
    clone:function() {
        return new phys.Vector2(this.x, this.y);
    }
};

phys.Vector2.add = function(v1, v2) {
    return new phys.Vector2(v1.x+v2.x, v1.y+v2.y);
}

phys.Polygon = function(points, density) {
    var sign;
    this.vertices = points.slice(0);
    this.area = phys.Polygon.calcArea({vertices:points});
    sign = this.area < 0 ? -1 : 1;
    this.area *= sign;
    this.centroid = phys.Polygon.calcCentroid({vertices:points});
    
    this.density = density || 1;
    this.mass = this.density * this.area;
    this.moment = -sign * phys.Polygon.calcMomentAlt({vertices:points}, this.centroid, this.mass);
};

phys.Polygon.prototype = {
    constructor: phys.Polygon,
    centroidSelf: function() {
        return phys.Polygon.calcCentroid(this);
    },
    areaSelf: function() {
        return phys.Polygon.calcArea(this);
    },
    momentSelf: function() {
        return phys.Polygon.calcMoment(this, this.mass);
    },
    rotateSelf: function(mat, point) {
        var p = point || this.centroid;
        phys.Polygon.rotate(this, p, mat);
    },
    translateSelf: function(v) {
        phys.Polygon.translate(this, v);
    },
    toString: function() {
        return '[' + this.x + ', ' + this.y + ']';
    }
};
phys.Polygon.calcArea = function(p) {
    var i, areaSum, pi, pn;
    areaSum = 0;
    for(i = 0; i < p.vertices.length - 1; i++) {
        pi = p.vertices[i];
        pn = p.vertices[i+1];
        areaSum += pi.x*pn.y-pn.x*pi.y;
    }
    return .5*areaSum;
}

phys.Polygon.rotate = function(poly, point, mat) {
    var i, rotated;
    rotated = [];
    for(i = 0; i < poly.vertices.length; i++) {
        rotated.push(poly.vertices[i].rotate(mat, point));
    }
    poly.vertices = rotated;
    //return new phys.Polygon(rotated, poly.density);
}

phys.Polygon.translate = function(poly, v) {
    var i;
    for(i = 0; i < poly.vertices.length; i++) {
        poly.vertices[i].addSelf(v);
    }
    poly.centroid.addSelf(v);
}

phys.Polygon.calcCentroid = function(p) {
    var i, aportion, areaSum, centroidSumx, centroidSumy, pi, pn, coef;
    areaSum = 0;
    centroidSumx = 0;
    centroidSumy = 0;
    for(i = 0; i < p.vertices.length; i++) {
        pi = p.vertices[i];
        pn = p.vertices[(i+1) % p.vertices.length];
        aportion = pi.x*pn.y - pn.x*pi.y;
            
        areaSum += aportion;
        centroidSumx += (pi.x+pn.x)*aportion;
        centroidSumy += (pi.y+pn.y)*aportion;
    }
    areaSum *= .5;
    coef = 1 / (6*areaSum);
    return new phys.Vector2(coef*centroidSumx, coef*centroidSumy);
}

phys.Polygon.calcMomentAlt = function(poly, point, mass) {
    var i, next, ISum, va, vb, turned, vs;
    va = new phys.Vector2(0, 0);
    vb = new phys.Vector2(0, 0);
    turned = new phys.Vector2(0, 0);
    ISum = 0;
    for(i = 0; i < poly.vertices.length; i++) {
        vs = poly.vertices;
        next = (i+1 == poly.vertices.length) ? 0 : i+1;
        va.x = point.x - vs[i].x; va.y = point.y - vs[i].y;
        vb.x = point.x - vs[next].x; vb.y = point.y - vs[next].y;
        turned.x = -va.y; turned.y = va.x;
        ISum += turned.dot(vb)*(va.dot(va)+va.dot(vb)+vb.dot(vb));
    }
    return mass / 6;
}

phys.Polygon.calcMoment = function(p, mass) {
    var i, areaSum, ISum, pi, pn;
    areaSum = 0;
    ISum = 0;
    for(i = 0; i < p.vertices.length - 1; i++) {
        pi = p.vertices[i];
        pn = p.vertices[i+1];
        areaSum += pi.x*pn.y-pn.x*pi.y;
        ISum += (pi.x*pi.x+pi.y*pi.y+pi.x*pn.x+pi.y*pn.y+pn.x*pn.x+pn.y*pn.y)
              * (pi.x*pn.y-pn.x*pi.y);
    }
    return (mass / 6)*(ISum / areaSum);
}

phys.Matrix2 = function(x1, y1, x2, y2) {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
};
phys.Matrix2.prototype = {
    constructor: phys.Matrix2,
    multiply: function(m) {
        return new phys.Vector2(this.x1*m.x+this.y1*m.y, this.x2*m.x+this.y2*m.y);
    }
};
phys.Matrix2.makeRotation = function(angle) {
        var s, c;
        s = Math.sin(angle);
        c = Math.cos(angle);
        return new phys.Matrix2(c, s, -s, c);
};

phys.World = function(geometry, boundingBox, spec) {
    var i;
    this.objs = []
    for(i in geometry) {
        this.objs.push({
            acc: new phys.Vector2(0, 0),
            vel: new phys.Vector2(0, 0), 
            tor: new phys.Vector2(0, 0), 
            geo: geometry[i]
        });
    }
    
    this.bounds = boundingBox;
    this.g = spec.g;
}
phys.World.prototype = {
    constructor: phys.World,
    stepWorld: function(dt) {
        var obj;
        for(i in this.objs) {
            obj = this.objs[i];
            obj.vel.addSelf(obj.acc.add(this.g));
            obj.geo.translateSelf(obj.vel);
        }
    }
}

function makeRect(ll, ur) {
    a = new phys.Vector2(ll.x, ll.y);
    b = new phys.Vector2(ll.x, ur.y);
    c = new phys.Vector2(ur.x, ur.y);
    d = new phys.Vector2(ur.x, ll.y);
    
    return new phys.Polygon([a, b, c, d]);
}

function makeRectEasy(llx, lly, urx, ury) {
    return makeRect(new phys.Vector2(llx, lly), new phys.Vector2(urx, ury));
}

function makeTri(ax, ay, bx, by, cx, cy) {
    var points = []
    points.push(new phys.Vector2(ax, ay));
    points.push(new phys.Vector2(bx, by));
    points.push(new phys.Vector2(cx, cy));
    return new phys.Polygon(points);
}

function makeRegularPolygon(nSides, sLen, xi, yi) {
    var i, angle, dir, pos, oldPos, vertices, rot;
    pos = new phys.Vector2(xi, yi);
    dir = new phys.Vector2(sLen, 0);
    angle = (Math.PI) - ((nSides-2)*Math.PI / nSides);
    rot = phys.Matrix2.makeRotation(angle);
    vertices = [new phys.Vector2(xi, yi)]
    for(i = 0; i < nSides-1; i++) {
        pos = phys.Vector2.add(pos, dir);
        vertices.push(pos)
        dir = dir.rotate(rot);
    }
    return new phys.Polygon(vertices);
}

function sandbox(processing) {
    var box, left, right, up, down, space
    //box = makeTri(50, 150, 150, 150, 100, 50);
    box = makeRegularPolygon(5, 25, 100, 100);
    var rot = phys.Matrix2.makeRotation(Math.PI / 15);
    var worldRect = {width: 600, height: 600};
    var world = new phys.World([box], makeRectEasy(0, 0, 300, 300), {g: new phys.Vector2(0, .3)});
    processing.draw = function() {
        function drawPoly(poly) {
            var i, vs, v1, v2;
            processing.strokeWeight(2);
            for(i = 0; i < poly.vertices.length; i++) {
                v1 = poly.vertices[i];
                v2 = poly.vertices[(i+1) % poly.vertices.length];
                processing.line(v1.x, v1.y, v2.x, v2.y);
            }
            processing.point(box.centroid.x, box.centroid.y)
        }
        
        handleInput();
        clear();
        drawPoly(box);
        processing.point(5, 5);
    }
    processing.setup = function() {
        processing.size(worldRect.width, worldRect.height);
        processing.background(230);
        processing.fill(230);
    }
    
    function clear() {
        var w = processing.width;
        var h = processing.height;
        processing.rect(0, 0, w, h);
    }
    
    function handleInput() {
        var moved = false;
        world.objs[0].acc = new phys.Vector2(0, 0);
        if(left) {
            world.objs[0].acc.x = -1;
            moved = true;
        }
        if(right) {
            world.objs[0].acc.x = 1;
            moved = true;
        }
        if(up) {
            world.objs[0].acc.y = -1;
            //box.translateSelf(new phys.Vector2(0, -5));
            moved = true;
        }
        if(down) {
            world.objs[0].acc.y = 1;
            //box.translateSelf(new phys.Vector2(0, 5));
            moved = true;
        }
        if(space) {
            box.rotateSelf(rot);
            world.stepWorld();
            moved = true;
        }
        return moved;
    }
    
    function handleKeyEvents(e, isDown) {
        if(e.which == 37) {
            left = isDown;
        }
        if(e.which == 39) {
            right = isDown;
        }
        if(e.which == 40) {
            down = isDown;
        }
        if(e.which == 38) {
            up = isDown;
        }
        if(e.which == 32) {
            space = isDown;
        }
    }
    
    $(document).keydown(function(e) {
        handleKeyEvents(e, true);
    });
        
    $(document).keyup(function(e) {
        handleKeyEvents(e, false);
    });
}
$(document).ready(function() {
    var canvas = document.getElementById('thing');
    var p = new Processing(canvas, sandbox);
});