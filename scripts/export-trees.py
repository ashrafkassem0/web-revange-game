import bpy
import os

OUT_DIR = r"d:\Works\games\reveange\game\assets\models\trees"

TREE_GROUPS = [
    (["Tree_Bark", "Tree_Leaves"], "tree-1.glb"),
    (["Tree_Bark.001", "Tree_Leaves.001"], "tree-2.glb"),
]

for names, filename in TREE_GROUPS:
    bpy.ops.object.select_all(action="DESELECT")
    selected = []
    for name in names:
        obj = bpy.data.objects.get(name)
        if not obj:
            raise RuntimeError(f"Missing object: {name}")
        obj.select_set(True)
        selected.append(obj)

    bpy.context.view_layer.objects.active = selected[0]
    out_path = os.path.join(OUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"Exported {out_path}")
