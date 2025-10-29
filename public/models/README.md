# Modèles 3D pour le terrain de volley

Ce dossier contient les modèles 3D utilisés dans l'application.

## Formats supportés

- **GLTF/GLB** (recommandé) : Format standard pour Three.js
- **OBJ** : Format classique
- **FBX** : Format Autodesk
- **STL** : Format pour l'impression 3D

## Comment ajouter un modèle de filet

1. **Téléchargez ou créez un modèle 3D** de filet de volley
2. **Convertissez-le en format GLB** (recommandé) ou GLTF
3. **Placez le fichier** dans ce dossier avec le nom `volleyball_net.glb`
4. **Ajustez l'échelle** dans le code si nécessaire

## Modèles recommandés

- **Dimensions** : 9m de large × 1.2m de haut
- **Échelle** : 1 unité = 1 mètre
- **Orientation** : Le filet doit être orienté verticalement
- **Centre** : Le modèle doit être centré à l'origine (0,0,0)

## Ajustement dans le code

Si votre modèle a une échelle différente, modifiez ces valeurs dans `VolleyballCourt.tsx` :

```typescript
netModel.scale.set(1, 1, 1); // Ajustez selon votre modèle
netModel.position.set(0, NET_HEIGHT - 0.6, 0);
```

## Outils recommandés

- **Blender** : Pour créer/modifier des modèles 3D
- **Online GLTF Viewer** : Pour prévisualiser les modèles
- **Three.js Editor** : Pour tester l'intégration
