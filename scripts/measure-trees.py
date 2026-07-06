import bpy
import os

for path in [
    r"d:\Works\games\reveange\game\assets\models\trees\tree-1.glb",
    r"d:\Works\games\reveange\game\assets\models\trees\tree-2.glb",
]:
    bpy.ops.import_scene.gltf(filepath=path)
    mins = [1e9, 1e9, 1e9]
    maxs = [-1e9, -1e9, -1e9]
    for obj in bpy.context.selected_objects:
        if obj.type != "MESH":
            continue
        for v in obj.bound_box:
            w = obj.matrix_world @ bpy.mathutils.Vector(v)
            mins[0] = min(mins[0], w.x)
            mins[1] = min(mins[1], w.y)
            mins[2] = min(mins[2], w.z)
            maxs[0] = max(maxs[0], w.x)
            maxs[1] = max(maxs[1], w.y)
            maxs[2] = max(maxs[2], w.z)
    print(path, "size", tuple(round(maxs[i]-mins[i], 2) for i in range(3)), "height", round(maxs[1]-mins[1], 2))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
