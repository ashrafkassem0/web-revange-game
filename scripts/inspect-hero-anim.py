import bpy

blend = r"d:\Works\games\reveange\game\assets\models\hero.glb"
fbx = r"C:\Users\ashka\Downloads\animations\Walking.fbx"

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

bpy.ops.import_scene.gltf(filepath=blend)
print("--- GLB ---")
for obj in bpy.data.objects:
    if obj.type == "ARMATURE" or obj.type == "MESH":
        print(obj.name, obj.type, obj.parent.name if obj.parent else "")
print("armatures", len(bpy.data.armatures))
print("actions before", [a.name for a in bpy.data.actions])

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

bpy.ops.import_scene.fbx(filepath=fbx)
print("--- Walking FBX ---")
for obj in bpy.data.objects:
    print(obj.name, obj.type)
print("armatures", len(bpy.data.armatures))
print("actions", [a.name for a in bpy.data.actions])
