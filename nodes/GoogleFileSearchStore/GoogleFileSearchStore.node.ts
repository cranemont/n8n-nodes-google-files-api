import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';

export class GoogleFileSearchStore implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google File Search Store',
		name: 'googleFileSearchStore',
		icon: 'file:google-file-search.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Gemini File Search Store를 관리하고 RAG 기반 문서 검색을 수행합니다',
		defaults: {
			name: 'Google File Search Store',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googleGeminiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Store',
						value: 'createStore',
						action: 'Create a new file search store',
						description: '새 File Search Store를 생성합니다',
					},
					{
						name: 'List Stores',
						value: 'listStores',
						action: 'List all stores',
						description: '모든 File Search Store 목록을 조회합니다',
					},
					{
						name: 'Get Store',
						value: 'getStore',
						action: 'Get store details',
						description: 'Store 상세 정보를 조회합니다',
					},
					{
						name: 'Delete Store',
						value: 'deleteStore',
						action: 'Delete a store',
						description: 'Store를 삭제합니다',
					},
					{
						name: 'Upload Document',
						value: 'uploadDocument',
						action: 'Upload document to store',
						description: 'Store에 문서를 업로드하고 인덱싱합니다',
					},
					{
						name: 'Query Documents',
						value: 'queryDocuments',
						action: 'Query documents in store',
						description: 'Store에서 시맨틱 검색을 수행합니다',
					},
					{
						name: 'Get Operation Status',
						value: 'getOperationStatus',
						action: 'Get operation status',
						description: '비동기 작업의 상태를 확인합니다',
					},
				],
				default: 'createStore',
			},
			// Create Store 파라미터
			{
				displayName: 'Display Name',
				name: 'storeDisplayName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['createStore'],
					},
				},
				description: 'Store의 표시 이름',
			},
			// Store 관련 공통 파라미터
			{
				displayName: 'Store Name',
				name: 'storeName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getStore', 'deleteStore', 'uploadDocument', 'queryDocuments'],
					},
				},
				description: 'File Search Store 이름 (예: fileSearchStores/abc123)',
			},
			// List Stores 파라미터
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 100,
				displayOptions: {
					show: {
						operation: ['listStores'],
					},
				},
				description: '한 페이지에 가져올 Store 수',
			},
			{
				displayName: 'Page Token',
				name: 'pageToken',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['listStores'],
					},
				},
				description: '다음 페이지를 가져오기 위한 토큰',
			},
			// Upload Document 파라미터
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				description: '업로드할 바이너리 데이터가 있는 속성명',
			},
			{
				displayName: 'Document Display Name',
				name: 'documentDisplayName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				description: '문서의 표시 이름 (비어있으면 파일명 사용)',
			},
			{
				displayName: 'Chunking Options',
				name: 'chunkingOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				options: [
					{
						displayName: 'Max Tokens Per Chunk',
						name: 'maxTokensPerChunk',
						type: 'number',
						typeOptions: {
							minValue: 50,
							maxValue: 1000,
						},
						default: 200,
						description: '청크당 최대 토큰 수',
					},
					{
						displayName: 'Max Overlap Tokens',
						name: 'maxOverlapTokens',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 100,
						},
						default: 20,
						description: '청크 간 중복 토큰 수',
					},
				],
			},
			{
				displayName: 'Custom Metadata',
				name: 'customMetadata',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				description: '문서에 추가할 메타데이터',
				options: [
					{
						name: 'metadataValues',
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
								displayName: 'Value Type',
								name: 'valueType',
								type: 'options',
								options: [
									{ name: 'String', value: 'string' },
									{ name: 'Numeric', value: 'numeric' },
								],
								default: 'string',
								description: '값의 타입',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: '메타데이터 값',
							},
						],
					},
				],
			},
			// Query Documents 파라미터
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['queryDocuments'],
					},
				},
				description: '검색할 질문 또는 쿼리',
			},
			{
				displayName: 'Metadata Filter',
				name: 'metadataFilter',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['queryDocuments'],
					},
				},
				description: 'AIP-160 형식의 메타데이터 필터 (예: author="홍길동")',
			},
			{
				displayName: 'Include Citations',
				name: 'includeCitations',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['queryDocuments'],
					},
				},
				description: '응답에 인용 출처 포함 여부',
			},
			{
				displayName: 'Max Results',
				name: 'maxResults',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
				default: 10,
				displayOptions: {
					show: {
						operation: ['queryDocuments'],
					},
				},
				description: '반환할 최대 결과 수',
			},
			// Get Operation Status 파라미터
			{
				displayName: 'Operation Name',
				name: 'operationName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getOperationStatus'],
					},
				},
				description: '확인할 작업의 이름 (예: operations/abc123)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('googleGeminiApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = 'https://generativelanguage.googleapis.com';

		const handleApiError = (error: unknown): Error => {
			const err = error as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };

			if (err.response) {
				const statusCode = err.response.status;
				const apiMessage = err.response.data?.error?.message || 'Unknown API error';

				if (statusCode === 400) {
					return new NodeOperationError(this.getNode(), `Bad request: ${apiMessage}`);
				} else if (statusCode === 403) {
					return new NodeOperationError(this.getNode(), 'API Key가 유효하지 않거나 권한이 없습니다');
				} else if (statusCode === 404) {
					return new NodeOperationError(this.getNode(), '리소스를 찾을 수 없습니다');
				} else if (statusCode === 429) {
					return new NodeOperationError(this.getNode(), 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요');
				}

				return new NodeOperationError(this.getNode(), apiMessage);
			}

			return new NodeOperationError(this.getNode(), err.message || 'Unknown error occurred');
		};

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject;

				if (operation === 'createStore') {
					// Create Store operation
					const displayName = this.getNodeParameter('storeDisplayName', i) as string;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/v1beta/fileSearchStores`,
							qs: { key: apiKey },
							headers: {
								'Content-Type': 'application/json',
							},
							body: {
								display_name: displayName,
							},
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'listStores') {
					// List Stores operation
					const pageSize = this.getNodeParameter('pageSize', i) as number;
					const pageToken = this.getNodeParameter('pageToken', i) as string;

					const qs: IDataObject = {
						key: apiKey,
						pageSize,
					};
					if (pageToken) {
						qs.pageToken = pageToken;
					}

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/fileSearchStores`,
							qs,
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'getStore') {
					// Get Store operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/${normalizedStoreName}`,
							qs: { key: apiKey },
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'deleteStore') {
					// Delete Store operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					try {
						await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/v1beta/${normalizedStoreName}`,
							qs: { key: apiKey },
							json: true,
						});
						responseData = { success: true, deletedStore: normalizedStoreName };
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'uploadDocument') {
					// Upload Document operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const documentDisplayName = this.getNodeParameter('documentDisplayName', i) as string;
					const chunkingOptions = this.getNodeParameter('chunkingOptions', i) as IDataObject;
					const customMetadata = this.getNodeParameter('customMetadata', i) as IDataObject;

					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					const binaryData = items[i].binary?.[binaryPropertyName];
					if (!binaryData) {
						throw new NodeOperationError(
							this.getNode(),
							`No binary data found for property "${binaryPropertyName}"`,
							{ itemIndex: i },
						);
					}

					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					const mimeType = binaryData.mimeType || 'application/octet-stream';
					const fileName = documentDisplayName || binaryData.fileName || 'unnamed_document';

					// Build metadata
					const metadata: IDataObject = {};
					if (customMetadata.metadataValues) {
						const metadataEntries = customMetadata.metadataValues as Array<{
							key: string;
							valueType: string;
							value: string;
						}>;
						for (const entry of metadataEntries) {
							if (entry.key) {
								if (entry.valueType === 'numeric') {
									metadata[entry.key] = { numericValue: parseFloat(entry.value) };
								} else {
									metadata[entry.key] = { stringValue: entry.value };
								}
							}
						}
					}

					// Build chunking config
					const chunkingConfig: IDataObject = {};
					if (chunkingOptions.maxTokensPerChunk) {
						chunkingConfig.maxTokensPerChunk = chunkingOptions.maxTokensPerChunk;
					}
					if (chunkingOptions.maxOverlapTokens) {
						chunkingConfig.maxOverlapTokens = chunkingOptions.maxOverlapTokens;
					}

					const boundary = '---n8n-boundary-' + Date.now().toString(16);

					const documentConfig: IDataObject = {
						display_name: fileName,
					};
					if (Object.keys(metadata).length > 0) {
						documentConfig.custom_metadata = metadata;
					}
					if (Object.keys(chunkingConfig).length > 0) {
						documentConfig.chunking_config = chunkingConfig;
					}

					const metadataPart = JSON.stringify({ document: documentConfig });

					const bodyParts: Buffer[] = [
						Buffer.from(`--${boundary}\r\n`),
						Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
						Buffer.from(metadataPart + '\r\n'),
						Buffer.from(`--${boundary}\r\n`),
						Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
						buffer,
						Buffer.from(`\r\n--${boundary}--\r\n`),
					];

					const body = Buffer.concat(bodyParts);

					try {
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/upload/v1beta/${normalizedStoreName}/documents`,
							qs: { key: apiKey },
							headers: {
								'Content-Type': `multipart/related; boundary=${boundary}`,
								'Content-Length': body.length.toString(),
							},
							body,
							json: false,
						});

						responseData = typeof response === 'string' ? JSON.parse(response) : response;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'queryDocuments') {
					// Query Documents operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const query = this.getNodeParameter('query', i) as string;
					const metadataFilter = this.getNodeParameter('metadataFilter', i) as string;
					const includeCitations = this.getNodeParameter('includeCitations', i) as boolean;
					const maxResults = this.getNodeParameter('maxResults', i) as number;

					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					const requestBody: IDataObject = {
						query,
						maxResults,
						includeCitations,
					};

					if (metadataFilter) {
						requestBody.metadataFilter = metadataFilter;
					}

					try {
						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/v1beta/${normalizedStoreName}:query`,
							qs: { key: apiKey },
							headers: {
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'getOperationStatus') {
					// Get Operation Status
					const operationName = this.getNodeParameter('operationName', i) as string;
					const normalizedOperationName = operationName.startsWith('operations/')
						? operationName
						: `operations/${operationName}`;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/${normalizedOperationName}`,
							qs: { key: apiKey },
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
