import { client } from './api/';
import { useEffect } from 'react';

function App() {
	useEffect(() => {
		async function test() {
			const { data, error } = await client.GET('/test/a');

			console.log(data, error);
		}

		test();
	});

  return (
    <>
			Test
    </>
  )
}

export default App
