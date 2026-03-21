"""
Custom DRF exception handler to expose actual error details.
"""
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    # Call DRF's default exception handler first
    response = exception_handler(exc, context)

    # If DRF didn't handle it (unhandled exception = 500), return details
    if response is None:
        return Response(
            {
                'error': str(exc),
                'type': type(exc).__name__,
                'detail': traceback.format_exc(),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
