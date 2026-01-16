import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class GoogleFileSearchStore implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google File Search Store',
		name: 'googleFileSearchStore',
		icon: 'file:googleGemini.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Gemini File Search Store를 관리하고 RAG 기반 문서 검색을 수행합니다',
		defaults: {
			name: 'File Search Store',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googlePalmApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Store',
						value: 'store',
						description: 'File Search Store 관리',
					},
					{
						name: 'Document',
						value: 'document',
						description: 'Store 내 문서 관리',
					},
					{
						name: 'Operation Status',
						value: 'operation',
						description: '비동기 작업 상태 확인',
					},
				],
				default: 'store',
			},
			// Store 작업
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['store'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: '새 File Search Store 생성',
						action: 'Create a store',
					},
					{
						name: 'List',
						value: 'list',
						description: 'Store 목록 조회',
						action: 'List stores',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Store 상세 정보 조회',
						action: 'Get store info',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Store 삭제',
						action: 'Delete a store',
					},
				],
				default: 'create',
			},
			// Document 작업
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['document'],
					},
				},
				options: [
					{
						name: 'Upload',
						value: 'upload',
						description: 'Store에 문서 업로드',
						action: 'Upload document to store',
					},
					{
						name: 'Import File',
						value: 'importFile',
						description: 'Files API 파일을 Store로 가져오기',
						action: 'Import file to store',
					},
					{
						name: 'List',
						value: 'list',
						description: 'Store 내 문서 목록 조회',
						action: 'List documents',
					},
					{
						name: 'Get',
						value: 'get',
						description: '문서 상세 정보 조회',
						action: 'Get document info',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: '문서 삭제',
						action: 'Delete a document',
					},
					{
						name: 'Query',
						value: 'query',
						description: 'RAG 기반 시맨틱 검색',
						action: 'Query documents with RAG',
					},
				],
				default: 'upload',
			},
			// Operation Status 작업
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['operation'],
					},
				},
				options: [
					{
						name: 'Get Status',
						value: 'getStatus',
						description: '비동기 작업 상태 확인',
						action: 'Get operation status',
					},
				],
				default: 'getStatus',
			},
			// Store 작업용 필드
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['store'],
						operation: ['create'],
					},
				},
				description: 'Store 표시 이름',
			},
			{
				displayName: 'Store Name',
				name: 'storeName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['store'],
						operation: ['get', 'delete'],
					},
				},
				placeholder: 'fileSearchStores/abc123',
				description: 'Store 이름',
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				default: 10,
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
				displayOptions: {
					show: {
						resource: ['store'],
						operation: ['list'],
					},
				},
				description: '반환할 Store 수 (1-20)',
			},
			{
				displayName: 'Page Token',
				name: 'pageToken',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['store'],
						operation: ['list'],
					},
				},
				description: '다음 페이지 토큰',
			},
			// Document 작업용 필드
			{
				displayName: 'Store Name',
				name: 'storeName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['upload', 'importFile', 'list', 'query'],
					},
				},
				placeholder: 'fileSearchStores/abc123',
				description: 'Store 이름',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['upload'],
					},
				},
				description: '업로드할 파일이 포함된 바이너리 속성명',
			},
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['upload'],
					},
				},
				description: '문서 표시 이름 (선택사항)',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['importFile'],
					},
				},
				placeholder: 'files/abc123',
				description: 'Files API 파일 이름',
			},
			{
				displayName: 'Document Name',
				name: 'documentName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['get', 'delete'],
					},
				},
				placeholder: 'fileSearchStores/abc123/documents/xyz789',
				description: '문서 이름',
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				default: 10,
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['list'],
					},
				},
				description: '반환할 문서 수 (1-100)',
			},
			{
				displayName: 'Page Token',
				name: 'pageToken',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['list'],
					},
				},
				description: '다음 페이지 토큰',
			},
			// Query 작업용 필드
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['query'],
					},
				},
				description: '검색 쿼리',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['query'],
					},
				},
				options: [
					{
						name: 'Gemini 2.5 Flash',
						value: 'gemini-2.5-flash-preview-05-20',
					},
					{
						name: 'Gemini 2.5 Pro',
						value: 'gemini-2.5-pro-preview-05-06',
					},
					{
						name: 'Gemini 2.0 Flash',
						value: 'gemini-2.0-flash',
					},
				],
				default: 'gemini-2.5-flash-preview-05-20',
				description: '사용할 Gemini 모델',
			},
			{
				displayName: 'Metadata Filter',
				name: 'metadataFilter',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['query'],
					},
				},
				placeholder: 'author="John Doe"',
				description: '메타데이터 필터 (선택사항)',
			},
			// Chunking Options
			{
				displayName: 'Chunking Options',
				name: 'chunkingOptions',
				type: 'collection',
				placeholder: 'Add Chunking Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['upload', 'importFile'],
					},
				},
				options: [
					{
						displayName: 'Max Tokens Per Chunk',
						name: 'maxTokensPerChunk',
						type: 'number',
						default: 256,
						description: '청크당 최대 토큰 수',
					},
					{
						displayName: 'Max Overlap Tokens',
						name: 'maxOverlapTokens',
						type: 'number',
						default: 64,
						description: '청크 간 중복 토큰 수',
					},
				],
			},
			// Custom Metadata
			{
				displayName: 'Custom Metadata',
				name: 'customMetadata',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Metadata',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['upload', 'importFile'],
					},
				},
				options: [
					{
						name: 'metadata',
						displayName: 'Metadata',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: '메타데이터 키',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: '메타데이터 값',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{ name: 'String', value: 'string' },
									{ name: 'Number', value: 'number' },
								],
								default: 'string',
								description: '값 타입',
							},
						],
					},
				],
			},
			// Force Delete
			{
				displayName: 'Force Delete',
				name: 'forceDelete',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['delete'],
					},
				},
				description: '강제 삭제 여부',
			},
			// Operation Status 필드
			{
				displayName: 'Operation Name',
				name: 'operationName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['operation'],
						operation: ['getStatus'],
					},
				},
				placeholder: 'operations/abc123',
				description: '작업 이름',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const baseUrl = 'https://generativelanguage.googleapis.com';

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'store') {
					if (operation === 'create') {
						const displayName = this.getNodeParameter('displayName', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'POST',
								url: `${baseUrl}/v1beta/fileSearchStores`,
								body: { displayName },
							},
						);

						returnData.push({ json: response });
					} else if (operation === 'list') {
						const pageSize = this.getNodeParameter('pageSize', i) as number;
						const pageToken = this.getNodeParameter('pageToken', i) as string;

						const qs: Record<string, string | number> = { pageSize };
						if (pageToken) {
							qs.pageToken = pageToken;
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'GET',
								url: `${baseUrl}/v1beta/fileSearchStores`,
								qs,
							},
						);

						returnData.push({ json: response });
					} else if (operation === 'get') {
						const storeName = this.getNodeParameter('storeName', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'GET',
								url: `${baseUrl}/v1beta/${storeName}`,
							},
						);

						returnData.push({ json: response });
					} else if (operation === 'delete') {
						const storeName = this.getNodeParameter('storeName', i) as string;

						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'DELETE',
								url: `${baseUrl}/v1beta/${storeName}`,
							},
						);

						returnData.push({ json: { success: true, deletedStore: storeName } });
					}
				} else if (resource === 'document') {
					if (operation === 'upload') {
						const storeName = this.getNodeParameter('storeName', i) as string;
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const displayName = this.getNodeParameter('displayName', i) as string;
						const chunkingOptions = this.getNodeParameter('chunkingOptions', i) as any;
						const customMetadata = this.getNodeParameter('customMetadata', i) as any;

						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

						const mimeType = binaryData.mimeType || 'application/octet-stream';
						const fileName = displayName || binaryData.fileName || 'document';

						const documentConfig: any = {
							displayName: fileName,
						};

						if (chunkingOptions.maxTokensPerChunk || chunkingOptions.maxOverlapTokens) {
							documentConfig.chunkingConfig = {
								whiteSpaceConfig: {},
							};
							if (chunkingOptions.maxTokensPerChunk) {
								documentConfig.chunkingConfig.whiteSpaceConfig.maxTokensPerChunk = chunkingOptions.maxTokensPerChunk;
							}
							if (chunkingOptions.maxOverlapTokens) {
								documentConfig.chunkingConfig.whiteSpaceConfig.maxOverlapTokens = chunkingOptions.maxOverlapTokens;
							}
						}

						if (customMetadata?.metadata?.length) {
							documentConfig.customMetadata = customMetadata.metadata.map((m: any) => ({
								key: m.key,
								[m.type === 'number' ? 'numericValue' : 'stringValue']: m.type === 'number' ? Number(m.value) : m.value,
							}));
						}

						const boundary = 'n8n_boundary_' + Date.now();
						const metadata = JSON.stringify(documentConfig);

						const body = Buffer.concat([
							Buffer.from(
								`--${boundary}\r\n` +
								`Content-Disposition: form-data; name="metadata"\r\n` +
								`Content-Type: application/json; charset=UTF-8\r\n\r\n` +
								`${metadata}\r\n` +
								`--${boundary}\r\n` +
								`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
								`Content-Type: ${mimeType}\r\n\r\n`
							),
							buffer,
							Buffer.from(`\r\n--${boundary}--`),
						]);

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'POST',
								url: `${baseUrl}/upload/v1beta/${storeName}:uploadToFileSearchStore`,
								headers: {
									'Content-Type': `multipart/related; boundary=${boundary}`,
									'X-Goog-Upload-Protocol': 'multipart',
								},
								body,
								json: false,
							},
						);

						returnData.push({ json: JSON.parse(response as string) });
					} else if (operation === 'importFile') {
						const storeName = this.getNodeParameter('storeName', i) as string;
						const fileName = this.getNodeParameter('fileName', i) as string;
						const chunkingOptions = this.getNodeParameter('chunkingOptions', i) as any;
						const customMetadata = this.getNodeParameter('customMetadata', i) as any;

						const body: any = { source: { fileSource: { name: fileName } } };

						if (chunkingOptions.maxTokensPerChunk || chunkingOptions.maxOverlapTokens) {
							body.chunkingConfig = {
								whiteSpaceConfig: {},
							};
							if (chunkingOptions.maxTokensPerChunk) {
								body.chunkingConfig.whiteSpaceConfig.maxTokensPerChunk = chunkingOptions.maxTokensPerChunk;
							}
							if (chunkingOptions.maxOverlapTokens) {
								body.chunkingConfig.whiteSpaceConfig.maxOverlapTokens = chunkingOptions.maxOverlapTokens;
							}
						}

						if (customMetadata?.metadata?.length) {
							body.customMetadata = customMetadata.metadata.map((m: any) => ({
								key: m.key,
								[m.type === 'number' ? 'numericValue' : 'stringValue']: m.type === 'number' ? Number(m.value) : m.value,
							}));
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'POST',
								url: `${baseUrl}/v1beta/${storeName}:importFile`,
								body,
							},
						);

						returnData.push({ json: response });
					} else if (operation === 'list') {
						const storeName = this.getNodeParameter('storeName', i) as string;
						const pageSize = this.getNodeParameter('pageSize', i) as number;
						const pageToken = this.getNodeParameter('pageToken', i) as string;

						const qs: Record<string, string | number> = { pageSize };
						if (pageToken) {
							qs.pageToken = pageToken;
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'GET',
								url: `${baseUrl}/v1beta/${storeName}/documents`,
								qs,
							},
						);

						returnData.push({ json: response });
					} else if (operation === 'get') {
						const documentName = this.getNodeParameter('documentName', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'GET',
								url: `${baseUrl}/v1beta/${documentName}`,
							},
						);

						returnData.push({ json: response });
					} else if (operation === 'delete') {
						const documentName = this.getNodeParameter('documentName', i) as string;
						const forceDelete = this.getNodeParameter('forceDelete', i) as boolean;

						const qs: Record<string, boolean> = {};
						if (forceDelete) {
							qs.force = true;
						}

						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'DELETE',
								url: `${baseUrl}/v1beta/${documentName}`,
								qs,
							},
						);

						returnData.push({ json: { success: true, deletedDocument: documentName } });
					} else if (operation === 'query') {
						const storeName = this.getNodeParameter('storeName', i) as string;
						const query = this.getNodeParameter('query', i) as string;
						const model = this.getNodeParameter('model', i) as string;
						const metadataFilter = this.getNodeParameter('metadataFilter', i) as string;

						const fileSearchTool: any = {
							fileSearch: {
								fileSearchStores: [storeName],
							},
						};

						if (metadataFilter) {
							fileSearchTool.fileSearch.metadataFilter = metadataFilter;
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'POST',
								url: `${baseUrl}/v1beta/models/${model}:generateContent`,
								body: {
									contents: [
										{
											role: 'user',
											parts: [{ text: query }],
										},
									],
									tools: [fileSearchTool],
								},
							},
						);

						// 응답 파싱
						const result: any = {
							answer: '',
							sources: [],
						};

						if (response.candidates?.[0]?.content?.parts) {
							for (const part of response.candidates[0].content.parts) {
								if (part.text) {
									result.answer += part.text;
								}
							}
						}

						if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
							result.sources = response.candidates[0].groundingMetadata.groundingChunks.map(
								(chunk: any) => ({
									document: chunk.retrievedContext?.title || '',
									uri: chunk.retrievedContext?.uri || '',
									text: chunk.retrievedContext?.text || '',
								}),
							);
						}

						returnData.push({
							json: {
								...result,
								rawResponse: response,
							},
						});
					}
				} else if (resource === 'operation') {
					if (operation === 'getStatus') {
						const operationName = this.getNodeParameter('operationName', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'googlePalmApi',
							{
								method: 'GET',
								url: `${baseUrl}/v1beta/${operationName}`,
							},
						);

						returnData.push({ json: response });
					}
				}
			} catch (error: any) {
				const errorDetails = {
					message: error.message,
					statusCode: error.statusCode,
					body: error.response?.body,
					cause: error.cause,
					description: error.description,
				};
				throw new NodeOperationError(this.getNode(), error.message, {
					itemIndex: i,
					description: JSON.stringify(errorDetails),
				});
			}
		}

		return [returnData];
	}
}
