# Interpolation

Input JSON can be modified using the interpolation system. All interpolations are represented as objects with a single field starting with ```$```. The variable name indicates the operation and the value of the variable represents the arguments to that operation.

The following ```input.json``` will create a file ```hello.txt``` with the contents ```HELLO WORLD```:

```
{
  "fs.file.interop_test": {
    "filename": { "$sum": [ "hello", ".", "txt" ] },
    "contents": { "$toUpper": "hello world" }
  }
}
```

Many of these operations (and their documentation) come straight from [lodash](https://lodash.com/).

## Arguments

Each operation treats input values differently to ensure the shortest amount of JSON necessary to perform the operation. To achieve this, some operations take an array with each entry representing a different argument. Others may take an array, or may take a single argument if all other arguments are optional. See examples below.

```
// single array argument
{ "$sum": [ 1, 2, 3 ] }
// => 6

// single number argument (second argument is optional)
{ "$floor": 5.123 }
// => 5

// two arguments represented as array (number and precision)
{ "$floor": [ 5.123, 2 ] }
// => 5.12

// single string argument
{ "$toUpper": "hello world" }
// => "HELLO WORLD"
```

## Operations

**NOTE: docs are incomplete (see [test/interpolations.ts](https://github.com/dakimakuri/thelas/blob/master/test/interpolations.ts))**

* [$add](#add)
* [$camelCase](#camelCase)
* [$capitalize](#capitalize)
* [$ceil](#ceil)
* [$clamp](#clamp)
* [$deburr](#deburr)
* [$divide](#divide)
* [$endsWith](#endsWith)
* [$escape](#escape)
* [$file](#file)
* [$findBy](#findBy)
* [$floor](#floor)
* [$fn](#fn)
* [$inRange](#inRange)
* [$jsonStringify](#jsonStringify)
* [$kebabCase](#kebabCase)
* [$lowerCase](#lowerCase)
* [$lowerFirst](#lowerFirst)
* [$maxBy](#maxBy)
* [$max](#max)
* [$md5](#md5)
* [$meanBy](#meanBy)
* [$mean](#mean)
* [$minBy](#minBy)
* [$min](#min)
* [$multiply](#multiply)
* [$padEnd](#padEnd)
* [$padStart](#padStart)
* [$pad](#pad)
* [$parseInt](#parseInt)
* [$repeat](#repeat)
* [$replace](#replace)
* [$round](#round)
* [$snakeCase](#snakeCase)
* [$split](#split)
* [$startCase](#startCase)
* [$startsWith](#startsWith)
* [$stringify](#stringify)
* [$subtract](#subtract)
* [$sumBy](#sumBy)
* [$sum](#sum)
* [$template](#template)
* [$toLower](#toLower)
* [$toUpper](#toUpper)
* [$trimEnd](#trimEnd)
* [$trimStart](#trimStart)
* [$trim](#trim)
* [$truncate](#truncate)
* [$unescape](#unescape)
* [$upperCase](#upperCase)
* [$upperFirst](#upperFirst)
* [$words](#words)

---

### add

Add two values together using the JavaScript + operator.

#### Arguments

* ```lh``` - Left hand value.
* ```rh``` - Right hand value.

#### Returns

```lh + rh```

#### Example

```
{ "$add": [ 1, 2 ] }
// => 3

{ "$add": [ "hello", ".txt" ] }
// => "hello.txt"
```

---

### camelCase

Converts string to [camel case](https://en.wikipedia.org/wiki/CamelCase).

#### Arguments

* ```[string=""]``` - The string to convert.

#### Returns

Returns the camel cased string.

#### Example

```
{ "$camelCase": "Foo Bar" }
// => 'fooBar'
 
{ "$camelCase": "--foo-bar--" }
// => 'fooBar'
 
{ "$camelCase": "__FOO_BAR__'" }
// => 'fooBar'
```

---

### ceil

Computes ```number``` rounded up to ```precision```.

#### Arguments

* ```number``` - The number to round up.
* ```[precision=0]``` - The precision to round up to.

#### Returns

Returns the rounded up number.

#### Example

```
{ "$ceil": 4.006 }
// => 5

{ "$ceil": [ 6.004, 2 ] }
// => 6.01

{ "$ceil": [ 6040, -2 ] }
// => 6100
```

---

### divide

Divide two numbers.

#### Arguments

* ```dividend``` - The first number in a division.
* ```divisor``` - The second number in a division.

#### Returns

Returns the quotient.

#### Example

```
{ "$divide": [ 6, 4 ] }
// => 1.5
```

---

### floor

Computes ```number``` rounded down to ```precision```.

#### Arguments

* ```number``` The number to round down.
* ```[precision=0]``` The precision to round down to.

#### Returns

Returns the rounded down number.

#### Example

```
{ "$floor": 4.006 }
// => 4

{ "$floor": [ 0.046, 2 ] }
// => 0.04
 
{ "$floor": [ 4060, -2 ] }
// => 4000
```

---

### max

Computes the maximum value of ```array```. If ```array``` is empty or falsey, ```undefined``` is returned.

#### Arguments

* ```array``` The array to iterate over.

#### Returns

Returns the maximum value.

#### Example

```
{ "$max": [4, 2, 8, 6] }
// => 8
 
{ "$max": [] }
// => undefined
```

---

**NOTE: docs are incomplete (see [test/interpolations.ts](https://github.com/dakimakuri/thelas/blob/master/test/interpolations.ts))**
