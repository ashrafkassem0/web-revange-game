import bpy

fbx = r"C:\Users\ashka\Downloads\Catwalk Walk Forward HighKnees.fbx"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=fbx)
print("--- Objects ---")
for obj in bpy.context.scene.objects:
    print(obj.name, obj.type, obj.parent.name if obj.parent else "")
print("actions", [a.name for a in bpy.data.actions])
print("armatures", len(bpy.data.armatures))
