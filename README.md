[![npm version](https://img.shields.io/npm/v/nserializejson.svg?style=flat-square)](https://www.npmjs.com/package/nserializejson)
[![npm downloads](https://img.shields.io/npm/dm/nserializejson.svg?style=flat-square)](https://www.npmjs.com/package/nserializejson)

# Description
NSerializeJson is a Vanilla JS form serializer which serializes form data into JSON object.

# Changes
##### v. 1.0.1 (2018-11-10)
`select` element parsing fix.

# Usage

## Install
`npm install nserializejson`

## Prepare and usage
Import:
```typescript
import {NSerializeJson} from "nserializejson";
```
or use the scripts tag (bundle):
```html
<script src="nserializejson.min.js"></script>
```
Define the HTML form:
```html
<form id="myForm">
  <input type="text" name="title" value="Finding Loot"/>
  <input type="text" name="author[name]" value="John Smith"/>
  <input type="text" name="author[job]"  value="Legendary Pirate"/>
</form>
```
Then:
(TypeScript)
```typescript        
NSerializeJson.serializeForm(document.getElementById("myForm") as HTMLFormElement);
```
(JavaScript, using scripts tag)
```javascript
NSerializeJson.NSerializeJson.serializeForm(document.getElementById("myForm")); // In JS bundle NSerializeJson.* required, because of UMD library!
```
Returns:
```javascript
{
  title: "Finding Loot",
  author: {
    name: "John Smith",
    job: "Legendary Pirate"
  }
}
```

Form input, textarea and select tags are supported. Nested attributes and arrays can be specified by using the `attr[nested][nested]` syntax.

HTML form:
```html
<form id="my-profile">
  <!-- simple attribute -->
  <input type="text" name="fullName"              value="Nikolay Maev" />

  <!-- nested attributes -->
  <input type="text" name="address[city]"         value="Rostov-on-Don" />
  <input type="text" name="address[state][name]"  value="Rostov oblast'" />
  <input type="text" name="address[state][abbr]"  value="ROV" />

  <!-- array -->
  <input type="text" name="jobbies[]"             value="coding" />
  <input type="text" name="jobbies[]"             value="cycling" />

  <!-- nested arrays, textareas, checkboxes ... -->
  <textarea              name="projects[0][name]">NVal</textarea>
  <textarea              name="projects[0][language]">TypeScript</textarea>
  <input type="hidden"   name="projects[0][popular]" value="0" />
  <input type="checkbox" name="projects[0][popular]" value="1" checked />

  <textarea              name="projects[1][name]">NSerializeJson</textarea>
  <textarea              name="projects[1][language]">TypeScript</textarea>
  <input type="hidden"   name="projects[1][popular]" value="0" />
  <input type="checkbox" name="projects[1][popular]" value="1"/>

  <!-- select -->
  <select name="selectOne">
    <option value="paper">Paper</option>
    <option value="rock" selected>Rock</option>
    <option value="scissors">Scissors</option>
  </select>

  <!-- select multiple options, just name it as an array[] -->
  <select multiple name="selectMultiple[]">
    <option value="red"  selected>Red</option>
    <option value="blue" selected>Blue</option>
    <option value="yellow">Yellow</option>
	</select>
</form>

```

JavaScript:

```typescript
NSerializeJson.serializeForm(document.getElementById("my-profile") as HTMLFormElement)

// returns =>
{
  fullName: "Nikolay Maev",

  address: {
    city: "Rostov-on-Don",
    state: {
      name: "Rostov oblast'",
      abbr: "ROV"
    }
  },

  jobbies: ["coding", "cycling"],

  projects: {
    '0': { name: "NVal", language: "TypeScript", popular: "1" },
    '1': { name: "NSerializeJson",   language: "TypeScript", popular: "0" }
  },

  selectOne: "rock",
  selectMultiple: ["red", "blue"]
}
```

The `serializeForm` function returns a JavaScript object, not a JSON String.

Parse values with :types
------------------------

All attribute values are **auto** by default. But you can force values to be parsed with specific types by appending the type with a colon.

```html
<form id="myForm">
  <input type="text" name="strbydefault"     value=":string is the default (implicit) type"/>
  <input type="text" name="text:string"      value=":string type can still be used to override other parsing options"/>
  <input type="text" name="excluded:skip"    value="Use :skip to not include this field in the result"/>

  <input type="text" name="numbers[0]:number"           value="0"/>
  <input type="text" name="numbers[1]:number"           value="1"/>
  
  <input type="text" name="keys[1.1]:number"         value="1.1"/>

  <input type="text" name="bools[true]:boolean"      value="true"/>
  <input type="text" name="bools[false]:boolean"     value="false"/>
  <input type="text" name="bools[zero]:boolean"         value="0"/>

  <input type="text" name="autos[string]:auto"          value="text with stuff"/>
  <input type="text" name="autos[one]:auto"               value="1"/>
  <input type="text" name="autos[two]:auto"               value="2"/>
  <input type="text" name="autos[true]:auto"            value="true"/>
  <input type="text" name="autos[false]:auto"           value="false"/>
  <input type="text" name="autos[null]:auto"            value="null"/>
  <input type="text" name="autos[list]:auto"            value='1, 2, 3, foo, bar, {"pet": "cat"}'/>
  
  <input type="text" name="arrays[empty]:array[auto]"        value=""/>
  <input type="text" name="arrays[auto]:array[auto]"         value="1, 2, 3, foo, bar"/>
  <input type="text" name="arrays[numbers]:array[number]"     value="1, 2, 3, foo, bar"/>

  <input type="text" name="json[empty]:json"       value="{}"/>
  <input type="text" name="json[not empty]:json"   value='{"my": "stuff"}'/>
</form>
```

```typescript
NSerializeJson.serializeForm(document.getElementById("myForm") as HTMLFormElement);

// returns =>
{
	"strbydefault": ":string is the default (implicit) type",
	"text": ":string type can still be used to override other parsing options",
	"numbers": [
		0,
		1
	],
	"keys": {
		"1.1": 1.1
	},
	"bools": {
		"true": true,
		"false": false,
		"zero": false
	},
	"autos": {
		"string": "text with stuff",
		"one": 1,
		"two": 2,
		"true": true,
		"false": false,
		"null": null,
		"list": [
			1,
			2,
			3,
			"foo",
			"bar",
			{
				"pet": "cat"
			}
		]
	},
	"arrays": {
		"empty": [],
		"auto": [
			1,
			2,
			3,
			"foo",
			"bar"
		],
		"numbers": [
			1,
			2,
			3,
			null, // <-- Non-digit.
			null // <-- Non-digit.
		]
	},
	"json": {
		"empty": {},
		"not empty": {
			"my": "stuff"
		}
	}
}
```
Types can also be specified with the attribute `data-value-type`, instead of having to add the ":type" suffix:
```html
<form>
  <input type="text" name="anumb"   data-value-type="number"  value="1"/>
  <input type="text" name="abool"   data-value-type="boolean" value="true"/>
  <input type="text" name="astring" data-value-type="string"  value="0"/>
</form>
```

## Options

By default `.serializeForm()` with default options has this behavior:

  * Values are always **auto** (unless appending :types to the input names)
  * Unchecked checkboxes are ignored (as defined in the W3C rules for [successful controls](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2)).
  * Disabled elements are ignored (W3C rules)
  * String keys are always **string** except the numbers

Allowed options `NSerializeJson.options` to change the default behavior:
  * **forceNullOnEmpty: false**, if true, will record `null` instead of empty value. Otherwise, records empties (`""`, `0`, `false`).
  * **useDotSeparatorInPath: false**, if true allows you to use the dot notation instead of brackets in the name attribute (i.e. `<input name="food.fruits[]" value="banana">`).
  * **useNumKeysAsArrayIndex: true**, when using integers as keys (i.e. `<input name="foods[0]" value="banana">`), serialize as an array (`{"foods": ["banana"]}`) instead of an object (`{"foods": {"0": "banana"}`).
  * **onBeforeParseValue: null**, if not null, allows you to prepare the value and return it by this method with signature `(value: string, type: string) => string;`.

More info about options usage in the sections below.

## Custom Types ##

You can define your own types or override the defaults with the `customTypes` option. For example:

```html
<form id="myForm">
  <input type="text" name="scary:alwaysBoo" value="not boo"/>
  <input type="text" name="str:string"      value="str"/>
  <input type="text" name="number:number"   value="5"/>
</form>
```

```typescript
NSerializeJson.parsers.push([
	{
        name: "alwaysBoo",
        parse: (val: any, forceNull: boolean): any => {
			return "boo";
        }
    }
]);

var stringParser = NSerializeJson.parsers.filter(x => x.name === "string")[0];
stringParser.parse = (val: any, forceNull: boolean): any => {
	return val + " override";
}

NSerializeJson.serializeForm(document.getElementById("myForm") as HTMLFormElement);

// returns =>
{
  "scary": "boo",        // <-- parsed with type :alwaysBoo
  "str": "str override", // <-- parsed with new type :string (instead of the default)
  "number": 5,           // <-- the default :number still works
}
```

The default parsers are defined in `NSerializeJson.parsers`. If you want to define your own set of parsers, you could also re-define that object.

## Use integer keys as array indexes ##

By default, all serialized integer numbers are indices, so if you want to serialize it as string keys you have to set the `useNumKeysAsArrayIndex: false`:

```html
<form id="myForm">
  <input type="text" name="arr[0]" value="foo"/>
  <input type="text" name="arr[1]" value="var"/>
  <input type="text" name="arr[5]" value="inn"/>
</form>
```

```typescript
NSerializeJson.options.useNumKeysAsArrayIndex = false;
NSerializeJson.serializeForm(document.getElementById("myForm") as HTMLFormElement);
// arr is an object =>
{'arr': {'0': 'foo', '1': 'var', '5': 'inn' }}

NSerializeJson.options.useNumKeysAsArrayIndex = true;
NSerializeJson.serializeForm(document.getElementById("myForm") as HTMLFormElement);
// arr is an array =>
{'arr': ['foo', 'var', null, null, null, 'inn']}
```