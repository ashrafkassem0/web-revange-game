import bpy
import os

ANIM_DIR = r"d:\Works\games\reveange\game\assets\models\animations"
OUT_PATH = r"d:\Works\games\reveange\game\assets\models\hero.glb"
BASE_FBX = os.path.join(ANIM_DIR, "Catwalk Walk Forward HighKnees.fbx")

# أنيمiشنات إضافية (بدون mesh — نفس هيكل Mixamo)
EXTRA_ANIMATIONS = [
    ("Running.fbx", "Running"),
    ("Jump.fbx", "Jump"),
    ("Shooting Arrow.fbx", "Shooting Arrow"),
    ("Great Sword Slash.fbx", "Sword Slash"),
]

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# الشخصية الأساسية: Erika Archer + مشية Catwalk
bpy.ops.import_scene.fbx(filepath=BASE_FBX)
armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")

for action in list(bpy.data.actions):
    action.name = "Walking"

idle = bpy.data.actions["Walking"].copy()
idle.name = "Idle"

for fbx_name, clip_name in EXTRA_ANIMATIONS:
    before = set(bpy.data.actions.keys())
    objects_before = set(bpy.context.scene.objects.keys())

    bpy.ops.import_scene.fbx(filepath=os.path.join(ANIM_DIR, fbx_name))

    new_actions = [bpy.data.actions[n] for n in bpy.data.actions.keys() if n not in before]
    if new_actions:
        new_actions[0].name = clip_name

    for obj in list(bpy.context.scene.objects):
        if obj.name not in objects_before:
            bpy.data.objects.remove(obj, do_unlink=True)

for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        obj.name = "HeroMesh" if "Body" in obj.name else obj.name
    if obj.type == "ARMATURE":
        obj.name = "HeroArmature"

# محاذاة على الأرض
mesh_objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if mesh_objs:
    min_z = min(o.matrix_world.translation.z for o in mesh_objs)
    for obj in bpy.context.scene.objects:
        obj.location.z -= min_z

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_animations=True,
    export_nla_strips=False,
    export_def_bones=False,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

print(f"Exported animated hero -> {OUT_PATH}")
print("Clips:", [a.name for a in bpy.data.actions])
