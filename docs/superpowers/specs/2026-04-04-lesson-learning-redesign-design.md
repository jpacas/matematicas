# Rediseño de Lecciones para Aprendizaje Guiado

Fecha: 2026-04-04
Proyecto: `matematicas`
Estado: Aprobado en conversación, pendiente de planificación de implementación

## Objetivo

Rediseñar la experiencia de estudio para que cada lección enseñe conceptos de forma simple y los aterrice inmediatamente con práctica. La app debe sentirse menos como un catálogo de contenido y más como un tutor guiado que explica, pregunta, corrige y sigue avanzando.

## Problema Actual

La interfaz actual funciona mejor como biblioteca de lecciones que como experiencia de aprendizaje:

- obliga al alumno a decidir por sí solo qué abrir y cómo avanzar
- presenta teoría en bloques largos antes de activar práctica
- trata el progreso más como registro que como ayuda pedagógica
- no ofrece una secuencia clara de explicación, intento, pista y corrección

## Usuario Principal

Alumno que estudia para examen y quiere entender rápido, practicar dentro de la misma lección y recibir ayuda gradual cuando se atora.

## Principios de Diseño

1. Explicar simple antes de formalizar.
2. Insertar práctica inmediatamente después de cada idea importante.
3. Dar ayuda en capas: pista breve primero, paso a paso después.
4. Reducir lectura pasiva y aumentar interacción útil.
5. Hacer visible el avance dentro de la lección.

## Enfoque Elegido

Se adopta una `Lección por Capas`.

Cada lección mostrará primero una versión clara y breve del concepto, seguida de un ejercicio corto para comprobar comprensión. La explicación más detallada solo aparecerá cuando haga falta, especialmente después de fallos o cuando el alumno quiera profundizar.

Este enfoque equilibra tres necesidades:

- rapidez para quien repasa
- apoyo pedagógico para quien se atora
- continuidad dentro de una sola pantalla

## Estructura de Cada Lección

Cada lección debe organizarse como una secuencia de microbloques:

1. `Idea en una frase`
   Una definición o intuición breve en lenguaje simple.

2. `Intuición visual o analogía`
   Explicación humana del concepto, evitando formalismo innecesario.

3. `Ejemplo mínimo`
   El caso más sencillo posible para reconocer el patrón.

4. `Tu turno`
   Un ejercicio corto inmediatamente después del ejemplo.

5. `Ayuda gradual`
   - Primer fallo: pista breve.
   - Segundo fallo: solución paso a paso.

6. `Aplicación`
   Un ejercicio parecido, pero con un poco más de dificultad o contexto.

7. `Señal de reconocimiento`
   Una regla corta para detectar el patrón en futuros ejercicios.

## Lógica de Interacción

Dentro de la lección, cada bloque debe seguir esta secuencia:

1. `Concepto`
   Dos o tres párrafos como máximo.

2. `Compruébalo`
   Una pregunta o ejercicio breve.

3. `Respuesta inmediata`
   - Si acierta: explicar por qué la respuesta es correcta.
   - Si falla: mostrar una pista breve.
   - Si vuelve a fallar: mostrar la solución paso a paso.

4. `Aplicación`
   Un ejercicio similar para consolidar la comprensión.

5. `Cierre del bloque`
   Una frase tipo: “si ves este patrón, piensa en X”.

## Pantallas Principales

### 1. Inicio

La portada debe dejar de ser un estado vacío y pasar a orientar al alumno.

Debe incluir:

- continuar donde se quedó
- lección recomendada
- temas que conviene repasar
- práctica reciente

### 2. Lección

Esta es la pantalla central del producto y la principal prioridad de rediseño.

Debe verse como una secuencia guiada de bloques pequeños:

- explicación breve
- mini ejercicio
- feedback
- siguiente concepto

No debe sentirse como artículo largo ni como documento de referencia.

### 3. Resumen de Avance

Debe enfocarse menos en “dominado/no dominado” y más en utilidad pedagógica.

Debe mostrar:

- conceptos que el alumno ya comprende
- errores frecuentes o temas débiles
- recomendación de siguiente lección

## Dirección Visual

La UI debe conservar el tono cálido actual, pero volverse más didáctica y menos editorial.

### Cambios visuales clave

- reducir bloques largos de texto
- usar tarjetas compactas y separaciones claras
- distinguir visualmente `explicación`, `ejercicio`, `pista` y `solución`
- mostrar progreso local como `Bloque 2 de 5`
- introducir etiquetas breves como `Pista clave`, `Error común`, `Qué detectar`

### Lo que se debe evitar

- interfaces tipo dashboard como producto analítico
- experiencias centradas en simulador de examen
- pantallas sobrecargadas con muchos estados y métricas

La sensación buscada es la de un tutor simple, guiado y claro.

## Impacto en la Arquitectura Actual

La estructura actual de lección en `app.js` está organizada como secciones largas:

- objetivo
- concepto
- definiciones
- fórmulas
- ejemplos
- ejercicios
- resumen

El rediseño exigirá cambiar de render basado en secciones grandes a render basado en bloques pedagógicos pequeños.

Esto implica:

- redefinir el modelo de contenido precargado
- agregar estado local por bloque de práctica
- registrar intentos, pistas mostradas y resolución
- separar claramente contenido explicativo de contenido interactivo

## Riesgos

1. Si la lección se fragmenta demasiado, puede perder continuidad.
2. Si la ayuda aparece demasiado pronto, reduce esfuerzo útil.
3. Si la explicación simple es demasiado breve, puede quedarse superficial.

## Mitigaciones

1. Agrupar microbloques dentro de una progresión visible.
2. Mantener la ayuda gradual: pista antes que solución.
3. Conservar una capa opcional de explicación más profunda cuando haga falta.

## Criterios de Éxito

El rediseño será exitoso si:

- el alumno puede avanzar por una lección sin enfrentarse a bloques largos de texto
- cada concepto importante se practica inmediatamente
- los fallos reciben apoyo útil sin romper el flujo
- la lección se siente guiada, simple y acumulativa
- el sitio ayuda a estudiar mejor, no solo a consultar contenido

## Fuera de Alcance en Esta Fase

- crear un simulador completo de examen
- rediseñar todo el sistema de currículo
- introducir backend o analítica compleja
- cambiar la app a otro framework o arquitectura

## Próximo Paso

Crear un plan de implementación centrado primero en la pantalla de `Lección`, luego en `Inicio`, y después en `Resumen de Avance`.
