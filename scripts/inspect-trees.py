import bpy

print('--- OBJECTS ---')
for obj in bpy.data.objects:
    print(obj.name, obj.type, obj.parent.name if obj.parent else '')

print('--- COLLECTIONS ---')
for col in bpy.data.collections:
    print(col.name, len(col.objects))

print('--- MESHES ---')
for mesh in bpy.data.meshes:
    print(mesh.name)
